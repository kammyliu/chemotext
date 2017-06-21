<?php

$myfile = fopen("/opt/local/neo4j/meshupdate/out/article-titles.txt", "w") or die("Unable to open file!");

fwrite($myfile, "pmid\ttitle\n");	

// repeatedly searching a set interval is faster than using LIMIT and SKIP, which read all results every time
$min = 0;
$step = 1000;

$max = getMaxPmid();

while($min <= $max){
	$pmids = getPmids($min, $step);
	
	getTitles($pmids, $myfile);
	
	$min += $step;
}

fclose($myfile);


// get a list of pmids between min and min+step
function getMaxPmid() {
	$url = 'http://chemotext.mml.unc.edu:7474/db/data/transaction/commit';

	$payload = array(
		"statements" => array(
			array(
				"statement" => "MATCH (n:Art) RETURN max(n.pmid)"
			)
		)
	);
	
	$options = array(
		'http' => array(
			'header'  => "Content-type: application/json\r\n",
			'method'  => 'POST',
			'content' => json_encode($payload)
		)
	);
	
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);
	if ($result === FALSE) { 
		return;
	}
	$max = json_decode($result, true);
	return $max["results"][0]["data"][0]["row"][0];	
}


// get a list of pmids between min and min+step
function getPmids($min, $step) {
	$url = 'http://chemotext.mml.unc.edu:7474/db/data/transaction/commit';

	$payload = array(
		"statements" => array(
			array(
				"statement" => "MATCH (n:Art) WHERE n.pmid >= {min} and n.pmid < {max} RETURN n.pmid",
				"parameters" => array("min" => $min, "max" => $min+$step)
			)
		)
	);
	//var_dump($payload);
	
	$options = array(
		'http' => array(
			'header'  => "Content-type: application/json\r\n",
			'method'  => 'POST',
			'content' => json_encode($payload)
		)
	);
	
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);
	if ($result === FALSE) { 
		return;
	}
	$pmids = json_decode($result, true);
	$pmids = $pmids["results"][0]["data"];
	
	return array_map("mapToData", $pmids);
}

function mapToData($v){
	return $v["row"][0];
}

function getTitles($pmids, $myfile) {
	$csv = implode(",", $pmids);
	$url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id='.$csv;
	
	$result = file_get_contents($url);
	
	//echo $result;
	
	$xml = simplexml_load_string($result);
	
	foreach ($xml->DocSum as $doc) {	//iterate through document
		$line = $doc->Id . "\t" . $doc->Item[5] . "\n";	//write the line id[tab]title
		fwrite($myfile, $line);	
	}	
}

?>
