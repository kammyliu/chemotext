var SEARCH_TYPE;

var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;

// fields specific to each search execution and used by this file
var _subterms = [];

var CORS = "https://cors-anywhere.herokuapp.com/"; //GITHUB PAGES

makeSynStack();	//start requesting the synstack file ASAP

// elements accessed by all search types
var tableform, displayText, subtermsCheckbox;
$(document).ready(function(){
	tableform = document.getElementById("tableform");
	displayText = document.getElementById("displayText");
	subtermsCheckbox = document.getElementById("include-subterms");
});

/* Fetch the stack */
function makeSynStack(){
	readTextFile(CORS+"http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n"); //GITHUB PAGES
}

/* Parse the received stack */
function reconstructSynStack(jsonObj){
	console.log("Retreived synstack");
	try {
		synStack.thornstack = JSON.parse(jsonObj);
	} catch (e){
		console.log(jsonObj);
	}
	console.log("Parsed synstack");
}	

/* Request a file */
function readTextFile(file,success,terminator){
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET",file,true);
	rawFile.onreadystatechange = function (){
		if(rawFile.readyState == 4){
			if(rawFile.status == 200 || rawFile.status == 0){
				var allText = rawFile.responseText;
				var split = allText.split(terminator);
				success(split);
			}
		}
	}
	rawFile.send(null);
	
	console.log("Fetching synstack");
}

/* Query the database */
function queryNeo4j(payload,successFunc){
	console.log(payload);
	$.ajax({ //443 works.
		url: CORS+"http://chemotext.mml.unc.edu:7474/db/data/transaction/commit", //GITHUB PAGES
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
	
/* Add the results of querying a term to the results stack */
function addTermOrSubterm(stack, data){
	var results = data["results"][0];
	var data2 = results["data"];
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];
		
		var check = stack.get(name);

		if(!check){
			var newTerm = new Term(name,type,stype);
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){newTerm.isDrug=true;}
			stack.add(name,newTerm);
			newTerm.addArt(pmid,date,stack,title);
		}else{			
			check.addArt(pmid,date,stack,title);
		}	
	}
}


/** Build initial UI **/
	
/* Build up basic page sections shared by each search type */
function makePageSections(){
	var content = document.getElementById("content");
	content.addEventListener('submit', function(e) {
		e.preventDefault();
	}, false);
	
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
		makeSTypes("typeSelect", true);	
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
function inputSuggestion($inputSection, inputId){
	$inputSection.prepend('<datalist id="datalist-'+inputId+
		'"></datalist><input class="suggestion-bar" id="'+inputId+
		'" list="datalist-'+inputId+'">');
	
	$("#"+inputId).keyup(function(keyEvent){
		var inputTerm = $(this).val();
		var check = synStack.search(inputTerm);
		var keyC = keyEvent.keyCode;
		
		//console.log(keyC);
		//console.log(check);

		if(check && check!=[] && keyC!=37 && keyC!=38 && keyC!=39 && keyC!=40){
			var newDataList = document.getElementById("datalist-"+inputId);
			newDataList.innerHTML = "";
			for(var i=0;i<check.length;i++){
				var option = document.createElement("option");
				if (check[i].includes("|")){
					check[i] = check[i].split('|')[0];
				}
				option.value = check[i];
				newDataList.appendChild(option);	
			}
		}
	});
}
	
/* Build the <select> with type options. 'withNone': true for the table results filter, false for Path Search subresults */
function makeSTypes(id, withNone){
	var select = document.getElementById(id);
	
	if(withNone){
		$(select).append('<option value="None">No Filter</option>');
	}
	
	var stypes = [
		"Disease",
		"Bacteria",
		"Viruses",
		"Bacterial Infections and Mycoses",
		"Neoplasms",
		"Nervous System Diseases",
		"Eye Diseases",
		"Male Urogenital Diseases",
		"Female Urogenital Diseases and Pregnancy Complications",
		"Hemic and Lymphatic Diseases",
		"Congenital, Hereditary, and Neonatal Diseases and Abnormalities",
		"Skin and Connective Tissue Diseases",
		"Nutritional and Metabolic Diseases",
		"Endocrine System Diseases",
		"Immune System Diseases",
		"Pathological Conditions, Signs and Symptoms",
		"Wounds and Injuries", 
		"Chemical",  
		"Drug",
		"Inorganic Chemicals",
		"Organic Chemicals",
		"Heterocyclic Compounds",
		"Polycyclic Compounds",
		"Macromolecular Substances",
		"Complex Mixtures",
		"Biomedical and Dental Materials",
		"Pharmaceutical Preparations",
		"Chemical Actions and Uses",
		"Other",
		"Hormones, Hormone Substitutes, and Hormone Antagonists",
		"Enzymes and Coenzymes",
		"Carbohydrates",
		"Lipids",
		"Amino Acids, Peptides, and Proteins",
		"Nucleic Acids, Nucleotides, and Nucleosides",
		"Biological Factors"
		];
	
	
	for(var i =0; i<stypes.length;i++){
		var option= document.createElement("option");
		option.value = stypes[i];
		if(stypes[i]== "Disease"){
			option.innerHTML = "Diseases and Indications";
			option.style.fontWeight = 'bold';
		}else if(stypes[i] == "Other"){
			option.innerHTML = "Proteins-Pathways-Intermediaries-Other";
			option.style.fontWeight = 'bold';
		}else if(stypes[i]=="Chemical"){
			option.innerHTML = "Chemicals";
			option.style.fontWeight = 'bold';
		}else if(stypes[i]=="Drug"){
			option.innerHTML = '- - ' + stypes[i];
			option.style.fontWeight = 'bold';
		}else{
			option.innerHTML = '- - ' + stypes[i];
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
function makeTables(stack,limit,index=0,type, tableElement){		
	$(tableform).find("tr").slice(1).remove();	//remove all tr except the first one
	
	var indexLimit = index+limit;
	if(indexLimit>stack.length){
		indexLimit = stack.length;
	}
	
	updateTableFooter(stack,limit,index, type);
	
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
function updateTableFooter(stack,limit,index, type){
	$("#prev-arrow")[0].onclick = function(){makeTables(stack,limit,index-limit, type);}

	$("#table-limit-button")[0].onclick = function(){
		tableLimit = parseInt(document.getElementById("table-limit").value);
		makeTables(stack,tableLimit,0, type);
	};
	
	$("#next-arrow")[0].onclick = function(){makeTables(stack,limit,index+limit, type);}

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
	for(var i= 0;i<node.stack.length;i++){
		if(node.stack[i]!=null){						
			var name = node.stack[i].pmid;
			if(node.stack[i].title!=null){
				name = node.stack[i].title;
			}
			html = html + "<p><a href=http://www.ncbi.nlm.nih.gov/pubmed/"+node.stack[i].pmid+">"+name+"</a></p>";
		}
	}
	html = html + "</body></html>"
	var newpage = window.open("");
	newpage.document.write(html)
}

/* Write the results CSV to a new window */
function onInitFs(fs, name, stack, withPmids){
	console.log('Opened File System:' + fs.name);
	var fileName = name + (withPmids ? "_pmids_chemotext.csv" : "_chemotext.csv");
	fs.root.getFile(fileName,{create:true}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter){
			var data = "";
			if(SEARCH_TYPE == "shared" && !withPmids){	
				var split = name.split("_");
				data = "Term \t Both \t" + split[0] + "\t" + split[1] + "\n";
			}
			var node = stack.first;
			for(var j=0;j<stack.length;j++){
				var arts = "";
				if (withPmids){
					for(var k=0;k<node.stack.length;k++){
						arts = arts+"\t"+node.stack[k].pmid;
					}	
				}
				
				data = data + node.name + ";" + node.count + arts;
				if(SEARCH_TYPE == "shared" && !withPmids){ 
					data = data + "\t" + node.sharedCount1 + "\t" + node.sharedCount2; 
				}
				data += "\n";
				if(node.right==null){
					break;
				}
				node = node.right;
			}
			
			fileWriter.addEventListener("writeend", function() {
				//window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+fileName);
				window.open("filesystem:https://kammyliu.github.io/temporary/"+fileName);	//GITHUB PAGES
			}, false);
			var blob = new Blob([data],{type: 'text/plain'});
			fileWriter.write(blob);
			console.log("WRITTEN");
		},errorHandler);
	},errorHandler);
}

/* Filters the results table. Rebuilds the table and updates the CSV download handler */
function filterStack(dropbox,stack,name){
	console.log("Stack Length:"+ stack.length);

	var dateAfter = document.getElementById("dateAfterInput");
	var dateBefore = document.getElementById("dateBeforeInput");
	
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
	var newStack = new ThornStack();

	var condition;
	if(type == "Disease" || type == "Chemical" || type == "Other"){
		condition = function(term){return term.type==type;};
	} else if(type=="Drug"){
		condition = function(term){return term.isDrug;};
	} else {
		condition = function(term){return term.stype==type;};
	}
	
	var term = stack.first;
	while(term != null){
		if(condition(term)){
			newStack.add(term.name, term.copy());
		}
		term = term.right;
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
		
	var newStack = new ThornStack();

	var term = stack.first;
	while(term != null){
		var termCopy = term.copy();
		for(var i =0;i<term.stack.length;i++){	
			if (toFilter(benchmark, term.stack[i])){
				termCopy.count--;
				termCopy.stack[i] = null;			
			}
		}
	
		if(termCopy.count > 0){
			newStack.add(term.name,termCopy);
		}
		
		var newArray = [];
		for(var j=0;j<termCopy.stack.length;j++){
			if(termCopy.stack[j]!=null){
				newArray.push(termCopy.stack[j]);
			}
		}
		termCopy.stack = newArray;
		
		term = term.right;
	}
	
	if(SEARCH_TYPE=="shared"){
		filterDateShared(newStack,year,month,day,removeBefore);
	}
	return newStack;
}


/** Helpers **/

/* Look up a string in the stack */ 
function getSelfOrSynonym(string){
	var term = synStack.get(string);
	if(term && term.includes('|')){
		return term.split('|')[1]; //term.mainTerm.name;
	} else {
		return string;
	}
}
	
/* Return the query string for getting co-occuring terms*/
function getMentionsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , 
			"parameters" : {"name": name}
		}]
	});
}

/* Return the query string for getting a term's subterms*/
function getSubtermsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " ,
			"parameters" : {"name": name}
		}]
	});
}

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
