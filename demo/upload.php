<?php
header('Content-Type: text/html; charset=utf-8');

$target_path = "uploads/";

$target_path = $target_path . basename($_FILES['file']['name']);

if (move_uploaded_file($_FILES['file']['tmp_name'], $target_path))
{
    echo json_encode(array(true, array('id' => $_FILES['file']['name'])));
}
else
{
    echo json_encode(array(false, 'There was an error uploading the file.'));
}