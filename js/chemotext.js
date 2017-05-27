var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;
var subTermMax = 0;
var subTermCount = 0; 
var subTerms = [];
var SEARCH_TYPE;

var CORS = "https://cors-anywhere.herokuapp.com/"; //GITHUB PAGES

var tableform, thepage, displayText, checkbox;
$(document).ready(function(){
	thepage = document.getElementById("thepage");
	tableform = document.getElementById("tableform");
	displayText = document.getElementById("displayText");
	checkbox = document.getElementById("mappedCheckbox");
});

function makeSynStack(){
	//console.log("StartSynStack");
	readTextFile(CORS+"http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");
	//readTextFile("http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n"); //GITHUB PAGES
}
	
function reconstructSynStack(jsonObj){
	console.log("Getting Ready to Parse JSON");
	try {
	synStack.thornstack = JSON.parse(jsonObj);
	} catch (e){
	console.log(jsonObj);
	}
	console.log("parsed JSON");
}	

function readTextFile(file,success,terminator){
	//console.log("START!");
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET",file,true);
	rawFile.onreadystatechange = function (){
		if(rawFile.readyState == 4){
			if(rawFile.status == 200 || rawFile.status == 0){
				var allText = rawFile.responseText;
				var split = allText.split(terminator);
				success(split);
				//console.log(allText);
			}else{
				//console.log("Failure READING");
			}
		}else{
			//console.log("FailureER");
		}
	}
	rawFile.send(null);
	//console.log("DONE");
}


function showSubterms(){
	var html = "<html><head><title>Subterms</title></head><body>";
	for(var i= 0;i<subTerms.length;i++){
		html = html + "<p>"+subTerms[i]+"</p>";
	}
	html = html + "</body></html>"
	var newpage = window.open("");
	newpage.document.write(html)
}


function queryNeo4j(payload,successFunc){
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
	
	
function makeFilters(stack,name){
	var select = document.getElementById("typeSelect");
	var filterType = document.getElementById("filter-type-button");
	filterType.onclick = function(){ filterStack(select,stack,name); }
}

// see about collapsing this into just filterType
function traverseTerms(stack, condition, operation){
	var term = stack.first;
	while(term != null){
		if(condition(term)){
			operation(term);
		}
		term = term.right;
	}	
}

/* returns a new, filtered stack */
function filterType(stack, type){
	var newStack = new ThornStack();

	var addToStack = function(term){
		newStack.add(term.name, term.copy());
	};
	
	var condition;
	if(type == "Disease" || type == "Chemical" || type == "Other"){
		condition = function(term){return term.type==type;};
	} else if(type=="Drug"){
		condition = function(term){return term.isDrug;};
	} else {
		condition = function(term){return term.stype==type;};
	}
	
	traverseTerms(stack, condition, addToStack);		
	return newStack;
}

/* returns a new, filtered stack. Pass true for DateAfter, false for DateBefore */
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
	
	if(isShared){
		filterDateShared(newStack,year,month,day,removeBefore);
	}
	return newStack;
}

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
	
	console.log("Updating CSV");
	if(!isArticle){
		makeDownloadableCSV(name,newStack);
	}
}
	
	
function compareNodeDate(benchmark, node){
	var date = new Date(node.year, node.month, node.day).getTime();		
	return date - benchmark;
}
// return if node date is before the benchmark
function nodeDateBefore(benchmark, node){	
	return compareNodeDate(benchmark, node) < 0;
}
// return if node date is after the benchmark
function nodeDateAfter(benchmark, node){
	return compareNodeDate(benchmark, node) > 0;
}


	
function errorHandler(e) {
	console.log(e);
}

function onInitFs(fs, name, stack, withPmids){
	console.log('Opened File System:' + fs.name);
	var fileName = name + (withPmids ? "_pmids_chemotext.csv" : "_chemotext.csv");
	fs.root.getFile(fileName,{create:true}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter){
			var data = "";
			if(isShared && !withPmids){	
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
				if(isShared && !withPmids){ 
					data = data + "\t" + node.sharedCount1 + "\t" + node.sharedCount2; 
				}
				data = data + "\n";
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

	
function makeDownloadableCSV(name,stack){
	$(".download-button").off("click");
	$(".download-button").click(function(){
		var withPmids = this.id!="csv";
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs){onInitFs(fs,name,stack,withPmids)}, errorHandler);
	});
}

function openArticleList(node){		
	var html = "<html><head><title>" + node.name + "</title></head><body>";
	for(var i= 0;i<node.stack.length;i++){
		if(node.stack[i]!=null){						
			var displayText = node.stack[i].pmid;
			if(node.stack[i].title!=null){
				displayText = node.stack[i].title;
			}
			html = html + "<p><a href=http://www.ncbi.nlm.nih.gov/pubmed/"+node.stack[i].pmid+">"+displayText+"</a></p>";
		}
	}
	html = html + "</body></html>"
	var newpage = window.open("");
	newpage.document.write(html)
}

function makeTables(stack,limit,index=0,type, tableElement){		
	$(tableform).find("tr").slice(1).remove();	//remove all tr except the first one

	//var maintable = $(tableform).find("table")[0];
	
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
		case 'article':
			makeArticleSearchTable(stack, index, indexLimit);
			return;
	}
	 
	var newchemicalarray = [];
	if(!isArticle){
		var node = stack.first;
		for(var i=0;i<index;i++){
			node = node.right;
		}
		for(var j=index;j<indexLimit;j++){
			if(isShared){
				newchemicalarray.push([node.name,node.count,node,node.sharedCount1,node.sharedCount2]);
			}else if(isPath){
				newchemicalarray.push([node.name,node.count,node,node.isSelected,node]);
			}else{
				newchemicalarray.push([node.name,node.count,node]);
			}
			if(node.right==null){
				break;
			}
			node = node.right;
		}
	}else{
		for(var j=index;j<indexLimit;j++){
			//console.log(stack.list[j]);
			newchemicalarray.push(stack.list[j]);
		}
	}
	
	for(x in newchemicalarray){
		xx = newchemicalarray[x];
		var newrow = document.createElement("TR");
		var col1 = document.createElement("TD");
		
		if(isPath){
			var col6 = document.createElement("TD");
			var checkbox = document.createElement("INPUT");
			checkbox.setAttribute("type","checkbox");
			col6.className = "countCol";
			col6.appendChild(checkbox);
			
			newrow.appendChild(col6);
			if(xx[3]){
				checkbox.checked = true;
			}
			checkbox.name = xx[0];
			$(checkbox).click(function(){
				var term = stack.get(this.name);
				term.isSelected = this.checked;
			});
		}
		
		if(!isArticle){
			var col2 = document.createElement("TD");
			col2.className = "countCol";
			col1.innerHTML = xx[0];
			col2.innerHTML = xx[1];
			if(!isPath){
				var button = document.createElement("button");
				button.innerHTML = xx[1];
				button.type = "button";
				button.className = "articleButton";
				col2.innerHTML = "";
				col2.appendChild(button);
				button.onclick = (function(x){
				return function(){
					var limit = 20;
					yy = newchemicalarray[x];
					var node = yy[2];
					var pmids = "Pmids=";
					for(var i= 0;i<node.stack.length;i++){
						pmids = pmids + node.stack[i].pmid + "|";
					}
					var html = "<html><head><title>" + node.name + "</title></head><body>";
					for(var i= 0;i<node.stack.length;i++){
						if(node.stack[i]!=null){						
							var displayText = node.stack[i].pmid;
							if(node.stack[i].title!=null){
								displayText = node.stack[i].title;
							}
							html = html + "<p><a href=http://www.ncbi.nlm.nih.gov/pubmed/"+node.stack[i].pmid+">"+displayText+"</a></p>";
						}
					}
					html = html + "</body></html>"
					var newpage = window.open("");
					newpage.document.write(html)
				};
				})(x);
			}
			
			newrow.appendChild(col1);
			newrow.appendChild(col2);
		}
		if(isArticle){
			//console.log(xx);
			var link = document.createElement("a");
			link.href = "http://www.ncbi.nlm.nih.gov/pubmed/"+xx;
			
			link.innerHTML = xx;
			link.style.textAlign = "center";
			col1.style.textAlign = "center";
			col1.appendChild(link);
			newrow.appendChild(col1);
		}
		if(isShared){
			var col4 = document.createElement("TD");
			var col5 = document.createElement("TD");
			col4.innerHTML = " "+xx[3]+" ";
			col5.innerHTML = " "+xx[4]+" ";
			col4.className = "countCol";
			col5.className = "countCol";
			newrow.appendChild(col4);
			newrow.appendChild(col5);
		}
		maintable.appendChild(newrow);
	} 
	

}
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
	
	
function addSimpleSubtermData(data){
	addTermOrSubterm(_stack,data);
	//console.log("FINISHED SUBTERM or TERM");
	
	subTermCount++;
	if(subTermCount==subTermMax){
		showResult(_stack, input.value, _subterms, SEARCH_TYPE);
	}
}
	
function getSelfOrSynonym(string){
		var term = synStack.get(string);
	if(term && term.includes('|')){
		term = term.split('|')[1]; //term.mainTerm.name;
	}
	return term;
}
	
//Table filter always includes "None". path-search intermediary step doesn't
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
	
function makePageSections(){
	thepage.addEventListener('submit', function(e) {
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
	$(downloadform).append('<button type="button" id="csv" class="download-button">View CSV</button>');
	$(downloadform).append('<button type="button" id="csv-with-pmids" class="download-button">CSV with pmids</button>');

	// filter fields
	var filterSection = document.getElementById("filterSection");
	$(filterSection).append('<select id="typeSelect"></select>');
	makeSTypes("typeSelect", true);	
	$(filterSection).append('<button type="submit" id="filter-type-button">Filter</button>');
	$(filterSection).append('<p>Date After:<input id="dateAfterInput" type="date">'+ 
		'Date Before:<input id="dateBeforeInput" type="date"></p>');
	
	// show subterms button
	$("#results").prepend('<button onclick="showSubterms()" id="show-subterms">Click Here to see Subterms</button>');
	
	// loading circle
	$(thepage).append('<img src="img/ajax-loader.gif" alt="Loading circle" id="loader">');
}


function getMentionsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
		}]
	});
}

function getSubtermsPayload(name){
	return JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": name}
		}]
	});
}


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


function showResult(stack, csvName, subterms, type){
	
	if(stack.length==0){
		$(displayText).text("No Results");
		$("#loader").hide();
		return;
	}
	
	$("#loader").hide();
	$("#results").show();
	
	if (subterms){
		$("#show-subterms").show();
	}
	
	makeFilters(stack, csvName);
	makeTables(stack, tableLimit, 0, type);
	makeDownloadableCSV(csvName, stack);
	
}