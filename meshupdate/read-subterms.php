<?php
$handle = @fopen($argv[1], "r");
$filter = "~^(NM |HM|PA|SY)[^\|]*~";
	// matches NM, HM, PA, and SY lines
	// "NM " is to not match NM_TH lines
	// only includes lines up to the first | (delimiter in SY lines, not present in other relevant lines)
	// may be multiple PA, HM, and SY lines for each record
	// some entry terms contain / (delimiter in HM lines)
	
//CSV headers
echo "name\tmainterm\tentry\tisDrug\n";

if ($handle) {
    while (($line = fgets($handle)) !== false) {
		if ($line == "*NEWRECORD\n" ){
			$term = array();
			$term["entry"] = "";
			$term["mainterm"] = "";
			$term["isDrug"] = 0;
			continue;
		}
		
		if ($line == "\n"){
			if (isset($term["name"], $term["mainterm"], $term["entry"], $term["isDrug"])){
				echo $term["name"]."\t".$term["mainterm"]."\t".$term["entry"]."\t".$term["isDrug"]."\n"; 
				//write the output line
			}
			continue;
		}
		
		$match = array();
		if (preg_match($filter, $line, $match)){
			if (sizeof($match)==0) continue;	//if no match
			$pieces = explode(" = ", $match[0]);
			$key = $pieces[0];
			$value = trim($pieces[1]);
			
			switch ($key) {
				case "NM":
					$term["name"] = $value;
					break;
				case "PA":
					$term["isDrug"] = 1;
					break;
				case "HM":
					//remove sometimes leading asterisk
					if (substr($value, 0, 1) == "*"){
						$value = substr($value, 1);
					}
					//remove first slash and remaining part
					$value = explode("/", $value)[0];
					
					if ($term["mainterm"] == "") $term["mainterm"] = $value;
					else $term["mainterm"].=("|".$value);
					break;
				case "SY":
					if ($term["entry"] == "") $term["entry"] = $value;
					else $term["entry"].=("|".$value);
					break;
			}
		}
		
	}
    fclose($handle);
}
?>
