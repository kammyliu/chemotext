<?php
$handle = @fopen($argv[1], "r");
$filter = "~^(MH |PA|MN = (A1(0|1)|B0(3|4|5)|C|D)|ENTRY|PRINT ENTRY)[^\|]*~";
	// matches MH, PA, MN, ENTRY, and PRINT ENTRY lines
	// "MH " is to not match MH_TH lines
	// only matches MN lines that are in the type domain
	// only includes ENTRY lines up to the first |
	// may be multiple PA, MN, ENTRY, and PRINT ENTRY lines for each record

$typeMap = array(
        "A10" => "Tissues",
	"A11" => "Cells",
	"B03" => "Bacteria",
	"B04" => "Viruses",
	"B05" => "Organism Forms",
	"C" => "Diseases",
	"C01" => "Bacterial Infections and Mycoses",
	"C02" => "Virus Diseases",
	"C03" => "Parasitic Diseases",
	"C04" => "Neoplasms",
	"C05" => "Musculoskeletal Diseases",
	"C06" => "Digestive System Diseases",
	"C07" => "Stomatognathic Diseases",
	"C08" => "Respiratory Tract Diseases",
	"C09" => "Otorhinolaryngologic Diseases",
	"C10" => "Nervous System Diseases",
	"C11" => "Eye Diseases",
	"C12" => "Male Urogenital Diseases",
	"C13" => "Female Urogenital Diseases and Pregnancy Complications",
	"C14" => "Cardiovascular Diseases",
	"C15" => "Hemic and Lymphatic Diseases",
	"C16" => "Congenital, Hereditary, and Neonatal Diseases and Abnormalities",
	"C17" => "Skin and Connective Tissue Diseases",
	"C18" => "Nutritional and Metabolic Diseases",
	"C19" => "Endocrine System Diseases",
	"C20" => "Immune System Diseases",
	"C21" => "Disorders of Environmental Origin",
	"C22" => "Animal Diseases",
	"C23" => "Pathological Conditions, Signs and Symptoms",
	"C24" => "Occupational Diseases",
	"C25" => "Chemically-Induced Disorders",
	"C26" => "Wounds and Injuries",
	"D" => "Chemicals and Drugs",
	"D01" => "Inorganic Chemicals",
	"D02" => "Organic Chemicals",
	"D03" => "Heterocyclic Compounds",
	"D04" => "Polycyclic Compounds",
	"D05" => "Macromolecular Substances",
	"D06" => "Hormones, Hormone Substitutes, and Hormone Antagonists",
	"D08" => "Enzymes and Coenzymes",
	"D09" => "Carbohydrates",
	"D10" => "Lipids",
	"D12" => "Amino Acids, Peptides, and Proteins",
	"D13" => "Nucleic Acids, Nucleotides, and Nucleosides",
	"D20" => "Complex Mixtures",
	"D23" => "Biological Factors",
	"D25" => "Biomedical and Dental Materials",
	"D26" => "Pharmaceutical Preparations",
	"D27" => "Chemical Actions and Uses",
);
$other = array("D06", "D08", "D09", "D10", "D12", "D13", "D23");

//CSV headers
echo "name\ttype\tsubtype\tentry\tisDrug\n";


if ($handle) {
    while (($line = fgets($handle)) !== false) {
		if ($line == "*NEWRECORD\n" ){
			$term = array();
			$term["entry"] = "";
			$term["isDrug"] = 0;
			continue;
		}
		
		if ($line == "\n"){
			// type will be undefined if no matched MN remained
			if (isset($term["type"], $term["name"], $term["subtype"], $term["entry"], $term["isDrug"])){
				echo $term["name"]."\t".$term["type"]."\t".$term["subtype"]."\t".$term["entry"]."\t".$term["isDrug"]."\n"; 
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
				case "MH":
					$term["name"] = $value;
					break;
				case "PA":
					$term["isDrug"] = 1;
					break;
				case "MN":
					if (isset($term["type"])) continue;
					// skip MN lines after the record's first
					
					$end = strpos($value, ".");	//find first period
					if ($end === false) $end = strlen($value);	//if no period, take whole string
					$prefix = substr($value, 0, $end);
					if (isset($typeMap[$prefix])) $term["subtype"] = $typeMap[$prefix];
					
					switch(substr($prefix, 0, 1)){
						case "A":
							$type = "Anatomy";
							break;
						case "B": case "C":
							$type = "Disease";
							break;
						case "D":
							if (in_array($prefix, $other)){
								$type = "Other";
							} else {
								$type = "Chemical";
							}
							break;
					}
					$term["type"] = $type;
					break;
				case "ENTRY": 
				case "PRINT ENTRY":
					if ($term["entry"] == ""){
						$term["entry"] = $value;	//set the first entry term
					} else {
						$term["entry"].=("|".$value);	//append | and the entry term
					}
					break;
			}
		}
		
	}
    fclose($handle);
}
?>
