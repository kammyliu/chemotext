var SEARCH_TYPE;	//works like an enum for which type of search is being executed

var tableLimit = 10;	//default number of results in one page of the table

var termBank = new TermBank(termList);	//the autocompletion list

// fields specific to each search execution and used by this file
var _subterms = [];	//the list of subterms mapped to the input term

// elements accessed by all search types
var tableform, displayText, subtermsCheckbox;
$(document).ready(function(){
	tableform = document.getElementById("tableform");
	displayText = document.getElementById("displayText");
	subtermsCheckbox = document.getElementById("include-subterms");
});

/* Query the database */
function queryNeo4j(payload,successFunc){
	console.log(payload);
	$.ajax({ //443 works.
		url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
		accepts: "application/json; charset=UTF-8",	
		dataType:"json",
		contentType:"application/json",
		data: payload,
		type:"POST",
		success:function(data,xhr,status){ successFunc(data); },
		error:function(xhr,err,msg){
			console.log(xhr);
			console.log(err+": "+msg);
			$("#loader").hide();
			$(displayText).text("Connection to Neo4j Database rejected");
		}
	});
}
	
/* Process the results of query into a list of Term objects */	
function readResults(data, withSubterms, withSharedCounts){
	var results = [];
	
	if (withSubterms){
		_subterms = data["results"][1]["data"][0].row[0];
	}
		
	data = data["results"][0]["data"];

	for (var i=0; i< data.length ; i++){
		//console.log(i+" out of "+data2.length);
		var row = data[i].row;
		
		var name = row[0]["name"];
		var type = row[0]["type"];
		var subtype = row[0]["subtype"];
		var isDrug = row[0]["isDrug"];
		
		var newTerm = new Term(name,type,subtype,isDrug);
	
		var articles = row[1];
		for (var j=0; j<articles.length; j++){
			var a = articles[j];
			var date = a["date"];
			var pmid = a["pmid"];
			var title = a["title"];
			newTerm.addArticle(pmid,date,title);
		}
		

		if (withSharedCounts){
			newTerm.sharedCount1 = row[2];
			newTerm.sharedCount2 = row[3];
		}

		results.push(newTerm);
	}
	return results;
}


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
	

/** UI event handlers **/

/* Open a new page listing subterms */
function showSubterms(){
	var html = "<html><head><title>Subterms</title></head><body>";
	for(var i= 0;i<_subterms.length;i++){
		html = html + "<p>"+_subterms[i]+"</p>";
	}
	html = html + "</body></html>"
	var newpage = window.open("");
	newpage.document.write(html)
}

/* Open a new page listing article names or ids */
function openArticleList(node){		
	
	var html = "<html><head><title>" + node.name + "</title></head><body>";
	
	var articles = node.articles;
	for (var i=0; i<articles.length; i++){
		var name = articles[i].getTitleOrId();
		html = html + "<p><a href=http://www.ncbi.nlm.nih.gov/pubmed/"+articles[i].pmid+">"+name+"</a></p>";
	}
	
	html = html + "</body></html>"
	var newpage = window.open("");
	newpage.document.write(html)
}

/* Write the results CSV to a new window */
function onInitFs(fs, name, stack, withPmids){
	//console.log('Opened File System:' + fs.name);
	var fileName = name + (withPmids ? "_pmids_chemotext.csv" : "_chemotext.csv");
	//fs.root.getFile(fileName,{create:true}, function(fileEntry){
	//	fileEntry.createWriter(function(fileWriter){
	var data = "";
	if(SEARCH_TYPE == "shared" && !withPmids){	
		var split = name.split("_");
		data = "Term \t Both \t" + split[0] + "\t" + split[1] + "\n";
	}
	for(var j=0;j<stack.length;j++){
		var node = stack[j];				

		var arts = "";
		if (withPmids){
			for(var k=0;k<node.articles.length;k++){
				arts = arts+","+node.articles[k].pmid;
			}	
		}
				
		data = data + '"' + node.name + '"' + "," + node.articles.length + arts;
		if(SEARCH_TYPE == "shared" && !withPmids){ 
			data = data + "," + node.sharedCount1 + "," + node.sharedCount2; 
		}
		data += "\n";
	}
			
			//fileWriter.addEventListener("writeend", function() {
			//	window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+fileName);
			//}, false);
	var blob = new Blob([data],{type: 'text/csv'});

	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(blob);
	a.download = fileName;
	a.click();//fileWriter.write(blob);
	console.log("WRITTEN");
	//	},errorHandler);
	//},errorHandler);
}

/* Filters the results table. Rebuilds the table and updates the CSV download handler */
function filterStack(dropbox,stack,name){
	console.log("Stack Length:"+ stack.length);

	var dateAfter = document.getElementById("dateAfterInput");
	var dateBefore = document.getElementById("dateBeforeInput");
	
// console.log(dateAfter.value);
// console.log(dateBefore.value);	

	var newStack = stack;
	
	// filter by type
	var type = dropbox.value;
	if(SEARCH_TYPE!="article" && type!="None"){
		name = name+"_"+type;
		newStack = filterType(newStack, type);
	}

	// filter by date after
	if(dateAfter.value!=""){
		name = name + "_After" + dateAfter.value;
		newStack = filterDate(newStack, true, dateAfter.value);
	}

	// filter by date after
	if(dateBefore.value!=""){
		name = name + "_Before" + dateBefore.value;
		newStack = filterDate(newStack, false, dateBefore.value);
	}
	
	console.log("Creating tables");
	makeTables(newStack,tableLimit,0);
	
	if(SEARCH_TYPE!="article"){
		console.log("Updating CSV");
		setDownloadHandler(name,newStack);
	}
}
	
/* Filters the input stack by type and returns a new stack */
function filterType(stack, type){
	var newStack = [];

	var condition;
	if(type == "Disease" || type == "Chemical" || type == "Other" || type == "Anatomy"){
		condition = function(term){return term.type==type;};
	} else if(type=="Drug"){
		condition = function(term){return term.isDrug;};
	} else {
		condition = function(term){return term.subtype==type;};
	}
	
	for (var i=0; i<stack.length; i++){
		var term = stack[i];
		if (condition(term)){
			newStack.push(term);
		}
	}
	return newStack;
}

/* Filters the input stack by date and returns a new stack. For 'removeBefore', pass true for DateAfter, false for DateBefore */
function filterDate(stack, removeBefore, dateValue){
	var split = dateValue.split("-");
	var year = parseInt(split[0]);
	var month = parseInt(split[1]);
	var day = parseInt(split[2]);
	var benchmark = new Date(year,month,day).getTime();

	var toFilter = removeBefore ? nodeDateBefore : nodeDateAfter;
		
	var newStack = [];
	
	for (var i=0; i<stack.length; i++){
		var term = stack[i];
		var termCopy = term.copy();	//also deep copies the articles array
		var articles = termCopy.articles;
		
		for(var j = articles.length -1; j >= 0 ; j--){
			if (toFilter(benchmark, articles[j])){
				articles.splice(j, 1);
			}
		}
		if (articles.length>0){
			newStack.push(termCopy);
		}
	}
	
	//resort the terms by new article count
	newStack.sort(function(term1, term2){
		return term2.articles.length - term1.articles.length;
	});
	
	if(SEARCH_TYPE=="shared"){
		filterDateShared(newStack,year,month,day,removeBefore);
	}
	return newStack;
}


/** Database query string builders **/
	
/* Return the query string for getting terms that co-occur with the input term*/
function getMentionsPayload(name, type){
	var typeFilter = getQueryTypeFilter(type);
	if (type=="Drug") type=true;

	return JSON.stringify({
		"statements" : [{
			// match Terms with the name 'name' that are mentioned by an 'article' that mentions a 'term'
			"statement": "MATCH (:Term{name:{name}})-[:MENTIONS]-(article)-[:MENTIONS]-(term"+typeFilter+") " +
				"RETURN term, collect(article) as articleList " +	//return each term and its list of articles
				"ORDER BY size(articleList) DESC", 	//sorted by number of articles
			"parameters" : {"name": name, "type": type}
		}]
	});
}

/* Return the query string for getting terms that co-occur with the input term or its subterms*/
function getMentionsWithSubtermsPayload(name, type){
	var typeFilter = getQueryTypeFilter(type);
	if (type=="Drug") type=true;

	return JSON.stringify({
		"statements" : [
			{
				"statement": "MATCH (:Term{name:{name}})-[:MAPPED]->(subterm) " +	// get subterms
					"WITH collect(subterm.name) as subtermNames " + 	// collect the list of subterm names
					
					"MATCH (n:Term)-[:MENTIONS]-(article)-[:MENTIONS]-(term"+typeFilter+") " +		// input term is mentioned by articles that mention other terms
					"WHERE n.name in subtermNames OR n.name = {name} " +	// where the initial terms are subterms or the input term
					
					"RETURN term, collect(article) as articleList " +	//return each term and its list of articles
					"ORDER BY size(articleList) DESC",	//sorted by number of articles
				"parameters" : {"name": name, "type": type}
			},
			{
				"statement": "match (:Term{name:{name}})-[:MAPPED]->(subterm) " +	// get subterms
					"RETURN collect(subterm.name)" ,	// return as one list
				"parameters" : {"name": name, "type": type}
			}		
		]
	});
}

/* Return the query string for getting terms that co-occur with at least one of the input terms*/
function getMentionsFromListPayload(terms, type){
	var typeFilter = getQueryTypeFilter(type);
	if (type=="Drug") type=true;

	return JSON.stringify({
		"statements" : [{
			"statement": "MATCH (n:Term)-[:MENTIONS]-(article)-[:MENTIONS]-(term"+typeFilter+") " +
				"WHERE n.name in {selectedTerms} " +
				"RETURN term, collect(article) as articleList " +	//return each term and its list of articles
				"ORDER BY size(articleList) DESC", 	//sorted by number of articles
			"parameters" : {"selectedTerms": terms, "type": type}
		}]
	});
}

/* Return the type modifier for a query */
function getQueryTypeFilter(type){
	var typeFilter="";	//no type filter
	if (type){
		if(type == "Disease" || type == "Other" || type == "Chemical" || type == "Anatomy"){
			typeFilter = ":Term{type:{type}}";	
		}else if (type=="Drug"){
			typeFilter = ":Term{isDrug:{type}}"; //will be corrected to isDrug:true	
		}else{
			typeFilter = ":Term{subtype:{type}}"; 	
		}	
	} 
	return typeFilter;
}


/** Helpers **/

/* Compare a Date and the date of a node */
function compareNodeDate(benchmark, node){
	var date = new Date(node.year, node.month, node.day).getTime();		
	return date - benchmark;
}

/* Return whether node date is before a benchmark Date */
function nodeDateBefore(benchmark, node){	
	return compareNodeDate(benchmark, node) < 0;
}

/* Return whether node date is after a benchmark Date*/
function nodeDateAfter(benchmark, node){
	return compareNodeDate(benchmark, node) > 0;
}

/* Generic error handler */
function errorHandler(e) {
	console.log(e);
}
