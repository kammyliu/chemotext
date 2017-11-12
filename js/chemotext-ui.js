/** Build initial UI **/
	
/* Build up basic page sections shared by each search type */
function makePageSections(){
	var content = document.getElementById("content");
	content.addEventListener('submit', function(e) {
		e.preventDefault();
	}, false);
	
	//remove the text since the termbank is loaded
	$("#preload-text").remove();	
	
	// table pagination and labels
	$(tableform).append('<img src="img/previous.png" class="table-arrow" id="prev-arrow">');
	$(tableform).append('<input id="table-limit" value="'+tableLimit+'">');
	$(tableform).append('<button id="table-limit-button" type="submit">Set Table Limit</button>');	
	$(tableform).append('<img src="img/next.png" class="table-arrow" id="next-arrow">');
	$(tableform).append('<p>Total Count: <span id="results-count"></span></p>');

	// download buttons
	var downloadform = document.getElementById("downloadform");
	if (downloadform != null){
		$(downloadform).append('<button type="button" id="csv" class="download-button">View CSV</button>');
		$(downloadform).append('<button type="button" id="csv-with-pmids" class="download-button">CSV with pmids</button>');
	}
	
	// filter fields
	var filterSection = document.getElementById("filterSection");
	if (filterSection != null){
		$(filterSection).append('<select id="typeSelect"></select>');
		makeTypeDropdown("typeSelect", true);	
		$(filterSection).append('<div>Date After:<input id="dateAfterInput" type="date">'+ 
			'Date Before:<input id="dateBeforeInput" type="date"></div>');
		$(filterSection).append('<button type="submit" id="filter-button">Filter</button>');
	}
	
	// show subterms button
	$("#results").prepend('<div id="subterm-wrapper"><button onclick="showSubterms()" id="show-subterms">Click Here to see Subterms</button></div>');
	
	// loading circle
	$(content).append('<img src="img/ajax-loader.gif" alt="Loading circle" id="loader">');
	
	// empty space to add room to bottom
	$("body").append('<div id="space"></div>');
}

/* Build the autocompleting search term field */
function makeAutocomplete($inputSection, inputId, example=''){
	$inputSection.prepend('<datalist id="datalist-'+inputId+
		'"></datalist><input class="suggestion-bar" data-example="'+example+'" id="'+inputId+
		'" list="datalist-'+inputId+'">');
	
	$("#"+inputId).keyup(function(keyEvent){
		var inputTerm = $(this).val();
		var newDataList = document.getElementById("datalist-"+inputId);
		newDataList.innerHTML = "";
		if (!inputTerm) return;
		
		var options = termBank.complete(inputTerm);
		
		for(var i=0;i<options.length;i++){
			var option = document.createElement("option");
			option.value = options[i];
			newDataList.appendChild(option);	
		}
	});
}

/* Build automatic example input feature. */
function addExampleLink(){
	$("#introText").append("<p style='text-align:center'><a id='example-link'>See an example.</a></p>");
	$("#example-link").click(function(e){
		e.preventDefault();
		$("#inputSection input").each(function(i, el){
			if ($(el).attr("data-example")){
				$(el).val($(el).attr("data-example"));
			}
		});
	});
} 

/* Build the <select> with type options. 'withNone': true for the table results filter, false for Path Search subresults */
function makeTypeDropdown(id, withNone){
	var select = document.getElementById(id);
	
	if(withNone){
		$(select).append('<option value="None">No Filter</option>');
	}
	
	// comments specify tree nodes in the 2017 MeSH trees
	// top-level types "Disease", "Chemical", and "Other" don't align with the MeSH trees
	// https://meshb.nlm.nih.gov/treeView
	
	var subtypes = [
		"Anatomy",
		"Tissues",	//A10
		"Cells",	//A11

		"Disease",
		"Bacteria",	//B03
		"Viruses",	//B04
		"Organism Forms",	//B05
		"Bacterial Infections and Mycoses",	//C01 (sequential from here to C26)
		"Virus Diseases",
		"Parasitic Diseases",
		"Neoplasms",
		"Musculoskeletal Diseases",
		"Digestive System Diseases",
		"Stomatognathic Diseases",
		"Respiratory Tract Diseases",
		"Otorhinolaryngologic Diseases",
		"Nervous System Diseases",
		"Eye Diseases",
		"Male Urogenital Diseases",
		"Female Urogenital Diseases and Pregnancy Complications",
		"Cardiovascular Diseases",
		"Hemic and Lymphatic Diseases",
		"Congenital, Hereditary, and Neonatal Diseases and Abnormalities",
		"Skin and Connective Tissue Diseases",
		"Nutritional and Metabolic Diseases",
		"Endocrine System Diseases",
		"Immune System Diseases",
		"Disorders of Environmental Origin",
		"Animal Diseases",
		"Pathological Conditions, Signs and Symptoms",
		"Occupational Diseases",
		"Chemically-Induced Disorders",
		"Wounds and Injuries",	//C26
		
		"Chemical",  
		"Drug",	//special sub-category
		"Inorganic Chemicals",	//D01
		"Organic Chemicals",	//D02
		"Heterocyclic Compounds",	//D03
		"Polycyclic Compounds",	//D04
		"Macromolecular Substances",	//D05
		"Complex Mixtures",	//D20
		"Biomedical and Dental Materials",	//D25
		"Pharmaceutical Preparations",	//D26
		"Chemical Actions and Uses",	//D27
		
		"Other",
		"Hormones, Hormone Substitutes, and Hormone Antagonists",	//D06
		"Enzymes and Coenzymes",	//D08
		"Carbohydrates",	//D09
		"Lipids",	//D10
		"Amino Acids, Peptides, and Proteins",	//D12
		"Nucleic Acids, Nucleotides, and Nucleosides",	//D13
		"Biological Factors"	//D23
		];
	
	
	for(var i =0; i<subtypes.length;i++){
		var option= document.createElement("option");
		option.value = subtypes[i];
		if(subtypes[i]== "Disease"){
			option.innerHTML = "Diseases and Indications";
			option.style.fontWeight = 'bold';
		}else if(subtypes[i] == "Anatomy"){
			option.style.fontWeight = 'bold';
			option.innerHTML = "Anatomy";
		}else if(subtypes[i] == "Other"){
			option.innerHTML = "Proteins-Pathways-Intermediaries-Other";
			option.style.fontWeight = 'bold';
		}else if(subtypes[i]=="Chemical"){
			option.innerHTML = "Chemicals";
			option.style.fontWeight = 'bold';
		}else if(subtypes[i]=="Drug"){
			option.innerHTML = '- - ' + subtypes[i];
			option.style.fontWeight = 'bold';
		}else{
			option.innerHTML = '- - ' + subtypes[i];
		}
		select.appendChild(option);
	}	
}



/** Build search results UI **/

/* display loading gif */
function showLoader(){
	$("#loader").css('display', 'block');
}

/* show the final results for any search type */
function showResult(stack, csvName, withSubterms){
	
	if(stack.length==0){
		$(displayText).text("No Results");
		$("#loader").hide();
		return;
	}
	
	$("#loader").hide();
	$("#results").show();
	
	if (withSubterms){
		$("#show-subterms").show();
	}
	
	if (document.getElementById("filterSection") != null) {
		setFilterHandler(stack, csvName);
	}
	if (document.getElementById("downloadform") != null) {
		setDownloadHandler(csvName, stack);
	}	
	makeTables(stack, tableLimit, 0);
}

/* Set the click handler for downloading the CSV */
function setDownloadHandler(name,stack){
	$(".download-button").off("click");
	$(".download-button").click(function(){
		var withPmids = this.id!="csv";
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs){onInitFs(fs,name,stack,withPmids)}, errorHandler);
	});
}

/* Set the click handler for filtering the results table */
function setFilterHandler(stack,name){
	var select = document.getElementById("typeSelect");
	var filterButton = document.getElementById("filter-button");
	filterButton.onclick = function(){ filterStack(select,stack,name); }
}

/* Build the results table */
function makeTables(stack,limit,index=0){		
	$(tableform).find("tr").slice(1).remove();	//remove all tr except the first one
	
	var indexLimit = index+limit;
	if(indexLimit>stack.length){
		indexLimit = stack.length;
	}
	
	updateTableFooter(stack,limit,index);
	
	switch (SEARCH_TYPE) {
		case 'connected':
			makeConnectedTermsTable(stack, index, indexLimit);
			return;
		case 'shared':
			makeSharedTermsTable(stack, index, indexLimit);
			return;
		case 'path-subresults':
			makePathSubresultsTable(stack, index, indexLimit);		
			return;
		case 'path-final-results':
			makePathFinalResultsTable(stack,index,indexLimit);
			return;
		case 'article':
			makeArticleSearchTable(stack, index, indexLimit);
			return;
	}

}

/* Update the table footer section. Called by makeTables() */
function updateTableFooter(stack,limit,index){
	$("#prev-arrow")[0].onclick = function(){makeTables(stack,limit,index-limit);}

	$("#table-limit-button")[0].onclick = function(){
		tableLimit = parseInt(document.getElementById("table-limit").value);
		makeTables(stack,tableLimit,0);
	};
	
	$("#next-arrow")[0].onclick = function(){makeTables(stack,limit,index+limit);}

	$("#results-count").text(stack.length);
	
	if(index == 0){
		$("#prev-arrow").hide();
	} else {
		$("#prev-arrow").show();
	}
	
	if(index+limit >= stack.length){
		$("#next-arrow").hide();
	} else {
		$("#next-arrow").show();
	}
}
	
