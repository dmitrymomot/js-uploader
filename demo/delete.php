<?php
if (empty($_POST['file_id'])) {
    exit;
}

$file = 'uploads/'.$_POST['file_id'];
if (is_file($file)) {
    unlink($file);
}