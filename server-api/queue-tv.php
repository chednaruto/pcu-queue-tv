<?php
date_default_timezone_set('Asia/Bangkok');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
include(dirname(__FILE__) . '/../inc/config.php');
function respond($payload, $statusCode) { http_response_code($statusCode); echo json_encode($payload); exit; }
function dep_codes_from_request() {
    $raw = isset($_POST['depcode']) ? $_POST['depcode'] : '';
    $parts = preg_split('/\s*,\s*/', $raw); $valid = array();
    foreach ($parts as $part) { $part = trim($part, " \t\n\r\0\x0B'\""); if ($part !== '' && preg_match('/^[A-Za-z0-9_-]{1,10}$/', $part)) $valid[] = $part; }
    return array_values(array_unique($valid));
}
function dep_sql($codes, $connection) { $quoted = array(); foreach ($codes as $code) $quoted[] = "'" . mysql_real_escape_string($code, $connection) . "'"; return implode(',', $quoted); }
function db_query_or_fail($sql, $connection) { $result = mysql_query($sql, $connection); if ($result === false) respond(array('success'=>false,'message'=>'Database query failed'),500); return $result; }
$action = isset($_POST['action']) ? strtolower(trim($_POST['action'])) : 'health'; $codes = dep_codes_from_request();
if ($action === 'health') respond(array('success'=>true,'message'=>'queue-tv api ready','serverTime'=>date('Y-m-d H:i:s')),200);
if (count($codes) === 0) respond(array('success'=>false,'message'=>'depcode is required'),400);
$depSql = dep_sql($codes, $connection);
if ($action === 'calling') {
    $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 5; if ($limit < 1) $limit = 1; if ($limit > 10) $limit = 10;
    $sql = "SELECT IFNULL(oqs.depq,o.oqueue) AS oqueue, sq.sd_queue_calling_curdep, sq.sd_queue_calling_slot, sq.sd_queue_calling_datetime, o.vn,o.hn, CONCAT('คุณ',pt.fname,' ',pt.lname) AS full_namecall, IFNULL(o.pt_priority,0) AS pt_priority, sq.sd_queue_calling_status, d.department FROM sd_queue_calling sq INNER JOIN ovst o ON sq.sd_queue_calling_vn = o.vn LEFT JOIN ovst_queue_server oqs ON o.vn = oqs.vn INNER JOIN patient pt ON o.hn = pt.hn INNER JOIN kskdepartment d ON d.depcode = sq.sd_queue_calling_curdep WHERE sq.sd_queue_calling_curdep IN (".$depSql.") AND DATE(sq.sd_queue_calling_datetime)=CURDATE() AND sq.sd_queue_calling_status='Y' ORDER BY sq.sd_queue_calling_datetime ASC LIMIT ".$limit;
    $result = db_query_or_fail($sql,$connection); $queues=array(); while($row=mysql_fetch_assoc($result)) $queues[]=$row;
    foreach($queues as $row){ $vn=mysql_real_escape_string($row['vn'],$connection); mysql_query("UPDATE sd_queue_calling SET sd_queue_calling_status='N' WHERE sd_queue_calling_vn='".$vn."'",$connection); }
    respond(array('success'=>true,'queues'=>$queues,'serverTime'=>date('Y-m-d H:i:s')),200);
}
if ($action === 'stats') {
    $sql = "SELECT (SELECT COUNT(*) FROM ovst ox WHERE ox.vstdate=CURDATE()) AS totalvisit, (SELECT COUNT(*) FROM ovst o LEFT JOIN sd_queue_calling sc ON o.vn=sc.sd_queue_calling_vn AND o.oqueue=sc.sd_queue_calling_queue WHERE o.vstdate=CURDATE() AND o.cur_dep IN (".$depSql.") AND (o.cur_dep_time >= TIME(sc.sd_queue_calling_datetime) OR sc.sd_queue_calling_datetime IS NULL)) AS waiting";
    $result=db_query_or_fail($sql,$connection); $row=mysql_fetch_assoc($result); respond(array('success'=>true,'stats'=>array('totalvisit'=>intval($row['totalvisit']),'waiting'=>intval($row['waiting'])),'serverTime'=>date('Y-m-d H:i:s')),200);
}
respond(array('success'=>false,'message'=>'Unsupported action'),400);
?>
