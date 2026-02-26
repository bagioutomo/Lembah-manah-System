
<?php
/**
 * LEMBAH MANAH - MYSQL RELATIONAL BRIDGE
 * Simpan file ini di public_html dengan nama api_lembah.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- KONFIGURASI DATABASE (Sesuaikan dengan hasil Database Wizard Bapak) ---
$host = "localhost";
$db_name = "u123_db_lembah"; // Ganti dengan Nama Database Bapak
$username = "u123_admin_user"; // Ganti dengan Username Database Bapak
$password = "PasswordBapak123"; // Ganti dengan Password Database Bapak

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["status" => "error", "message" => "Koneksi Gagal: " . $exception->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. HANDLING DOWNLOAD DATA (GET) ---
if ($method == 'GET') {
    // Fungsi ini bisa dikembangkan jika Bapak ingin menarik data dari MySQL kembali ke aplikasi
    echo json_encode(["status" => "success", "message" => "Bridge Active"]);
}

// --- 2. HANDLING SINKRONISASI (POST) ---
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        echo json_encode(["status" => "error", "message" => "Data Kosong"]);
        exit();
    }

    try {
        $conn->beginTransaction();

        // A. SINKRONISASI MASTER KATEGORI (Truncate & Insert)
        $conn->exec("SET FOREIGN_KEY_CHECKS = 0");
        $conn->exec("TRUNCATE TABLE kategori");
        $stmtKat = $conn->prepare("INSERT INTO kategori (nama, is_operasional) VALUES (?, ?)");
        foreach ($data['table_kategori'] as $k) {
            $stmtKat->execute([$k['name'], $k['isOperational'] ? 1 : 0]);
        }

        // B. SINKRONISASI MASTER DOMPET
        $conn->exec("TRUNCATE TABLE dompet");
        $stmtDom = $conn->prepare("INSERT INTO dompet (nama) VALUES (?)");
        foreach ($data['table_dompet'] as $d) {
            $stmtDom->execute([$d]);
        }
        $conn->exec("SET FOREIGN_KEY_CHECKS = 1");

        // C. SINKRONISASI PEMASUKAN (Insert on Duplicate)
        $stmtInc = $conn->prepare("INSERT INTO pemasukan (id, tanggal, keterangan, cash_naim, cash_tiwi, bank_bri, bank_bni, total_bruto) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                                   ON DUPLICATE KEY UPDATE tanggal=VALUES(tanggal), keterangan=VALUES(keterangan), total_bruto=VALUES(total_bruto)");
        foreach ($data['table_pemasukan'] as $i) {
            $stmtInc->execute([$i['id'], $i['date'], $i['notes'], $i['cashNaim'], $i['cashTiwi'], $i['bri'], $i['bni'], $i['total']]);
        }

        // D. SINKRONISASI PENGELUARAN
        $stmtExp = $conn->prepare("INSERT INTO pengeluaran (id, tanggal, keterangan, qty, harga_satuan, nama_dompet, nama_kategori, pic_input, total_akhir) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                   ON DUPLICATE KEY UPDATE tanggal=VALUES(tanggal), total_akhir=VALUES(total_akhir)");
        foreach ($data['table_pengeluaran'] as $e) {
            $total = (float)$e['amount'] * (float)($e['qty'] ?? 1);
            $stmtExp->execute([$e['id'], $e['date'], $e['notes'], $e['qty'] ?? 1, $e['amount'], $e['wallet'], $e['category'], $e['createdBy'], $total]);
        }

        // E. SINKRONISASI LABA RUGI SUMMARY
        $stmtLR = $conn->prepare("REPLACE INTO laba_rugi (periode, total_omzet, pendapatan_bersih, total_biaya_opex, laba_operasional) VALUES (?, ?, ?, ?, ?)");
        foreach ($data['table_laba_rugi'] as $lr) {
            $stmtLR->execute([$lr['periode'], $lr['total_income'], $lr['net_revenue'], $lr['total_opex'], $lr['op_profit']]);
        }

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "Database Relasional Berhasil Disinkronkan!"]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
    }
}
?>
