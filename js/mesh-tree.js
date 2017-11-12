/** 
* The tree of types and subtypes as used in Chemotext.
* Top-level types don't completely align with the MeSH tree. 
* Subtypes are second-level nodes in the MeSH tree (labeled in comments).
* https://meshb.nlm.nih.gov/treeView
*
* isMainType: a top-level category
* label: how this type is written in the UI
* isFlag: a boolean property in the database, not a type or subtype
* flagName: the name of this property in the database
*/
var MeshTree = {
	"Anatomy": {isMainType: true},
	"Tissues": {},	//A10
	"Cells": {},	//A11
	
	"Disease": {isMainType: true, label: "Diseases and Indications"},
	"Bacteria": {},	//B03
	"Viruses": {},	//B04
	"Organism Forms": {},	//B05
	"Bacterial Infections and Mycoses": {},	//C01 (sequential from here to C26)
	"Virus Diseases": {},
	"Parasitic Diseases": {},
	"Neoplasms": {},
	"Musculoskeletal Diseases": {},
	"Digestive System Diseases": {},
	"Stomatognathic Diseases": {},
	"Respiratory Tract Diseases": {},
	"Otorhinolaryngologic Diseases": {},
	"Nervous System Diseases": {},
	"Eye Diseases": {},
	"Male Urogenital Diseases": {},
	"Female Urogenital Diseases and Pregnancy Complications": {},
	"Cardiovascular Diseases": {},
	"Hemic and Lymphatic Diseases": {},
	"Congenital, Hereditary, and Neonatal Diseases and Abnormalities": {},
	"Skin and Connective Tissue Diseases": {},
	"Nutritional and Metabolic Diseases": {},
	"Endocrine System Diseases": {},
	"Immune System Diseases": {},
	"Disorders of Environmental Origin": {},
	"Animal Diseases": {},
	"Pathological Conditions, Signs and Symptoms": {},
	"Occupational Diseases": {},
	"Chemically-Induced Disorders": {},
	"Wounds and Injuries": {},	//C26
	
	"Chemical": {isMainType: true, label: "Chemicals"},  
	"Drug": {isFlag: true, flagName: "isDrug"},
	"Inorganic Chemicals": {},	//D01
	"Organic Chemicals": {},	//D02
	"Heterocyclic Compounds": {},	//D03
	"Polycyclic Compounds": {},	//D04
	"Macromolecular Substances": {},	//D05
	"Complex Mixtures": {},	//D20
	"Biomedical and Dental Materials": {},	//D25
	"Pharmaceutical Preparations": {},	//D26
	"Chemical Actions and Uses": {},	//D27
	
	"Other": {isMainType: true, label: "Proteins-Pathways-Intermediaries-Other"},
	"Hormones, Hormone Substitutes, and Hormone Antagonists": {},	//D06
	"Enzymes and Coenzymes": {},	//D08
	"Carbohydrates": {},	//D09
	"Lipids": {},	//D10
	"Amino Acids, Peptides, and Proteins": {},	//D12
	"Nucleic Acids, Nucleotides, and Nucleosides": {},	//D13
	"Biological Factors": {}	//D23
};