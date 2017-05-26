var countER = 6;
var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;

var subTermMax = 0;
var subTermCount = 0; 
var subTerms = [];

var CORS = "https://cors-anywhere.herokuapp.com/";

function makeSynStack(){
	//console.log("StartSynStack");
	readTextFile(CORS+"http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");
	//readTextFile("http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");
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
		url: CORS+"http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
		accepts: "application/json; charset=UTF-8",	
		dataType:"json",
		contentType:"application/json",
		data: payload,
		type:"POST",
		success:function(data,xhr,status){ successFunc(data); },
		error:function(xhr,err,msg){
			console.log(xhr);
			console.log(err+": "+msg);
			$("#loader").remove();
			$(displayText).text("Connection to Neo4j Database rejected");
		}
	});
}
	
	
function makeFilters(stack,name){
	var select = document.getElementById("typeSelect");
	var filterType = document.getElementById("filter-type-button");
	filterType.onclick = function(){ filterStack(select,stack,name); }
}

function traverseTerms(stack, condition, operation){
	var term = stack.first;
	while(term != null){
		if(condition(term)){
			operation(term);
		}
		term = term.right;
	}	
}

/* returns filtered stack */
function filterType(stack, type){
	var newStack = new ThornStack();

	if(type == "Disease" || type == "Chemical" || type == "Other"){
		traverseTerms(stack, 
			function(term){return term.type==type;},
			function(term){newStack.add(term.name, term.copy());}
		);
	
		// var term = stack.first;
		// while(term != null){
			// if(term.type == type){
				// newStack.add(term.name,term.copy());
			// }
			// term = term.right;
		// }
	}else if(type=="Drug"){
		traverseTerms(stack, 
			function(term){return term.isDrug;},
			function(term){newStack.add(term.name, term.copy());}
		);	
	}else{
		console.log("Check -3");
		var term = stack.first;
		while(true){
			if(term.stype == type){
				newStack.add(term.name,term.copy());
			}
			if(term.right!=null){
				term = term.right;
			}else{
				break;
			}
		}		
	}	
}

function filterStack(dropbox,stack,name){
	console.log("Stack Length:"+ stack.length);

	var dateAfter = document.getElementById("dateAfterInput");
	var dateBefore = document.getElementById("dateBeforeInput");
	var newStack = new ThornStack();
	
	var type = dropbox.value;
	
	if(isArticle || type=="None"){
		newStack = stack;
	} else {
		name = name+"_"+type;
		newStack = filterType(stack, type);
	}

	//OK
	console.log("Check 1");
	var newnewStack = new ThornStack();
	if(dateAfter.value==""){
		console.log("Check 2");
		newnewStack = newStack;
	}else{
		console.log("Check 3");
		name = name + "_After" + dateAfter.value;
		console.log(dateAfter.value);
		var split = dateAfter.value.split("-");
		var month = parseInt(split[1]);
		var day = parseInt(split[2]);
		var year = parseInt(split[0]);
		//console.log("Check 4");
		var term = newStack.first;
		while(true){
			//break;
			//console.log("Check 5");
			var termCopy = term.copy();
			for(var i =0;i<term.stack.length;i++){	
				if(term.stack[i]==null){
					console.log(term.stack);
				}
				
				if(term.stack[i].year > year){
				
				}else if(term.stack[i].year == year){
					if(term.stack[i].month > month){
					
					}else if(term.stack[i].month == month){
						if(term.stack[i].day < day){
							termCopy.count--;
							termCopy.stack[i] = null;
						}
					}else{
						termCopy.count--;
						termCopy.stack[i] = null;
					}
				}else{
					termCopy.count--;
					termCopy.stack[i] = null;
				}
			
			}
		
			if(termCopy.count > 0){
				//console.log("Do we even Exist");
				newnewStack.add(term.name,termCopy);
			}
			var newArray = [];
			for(var j=0;j<termCopy.stack.length;j++){
				if(termCopy.stack[j]!=null){
					newArray.push(termCopy.stack[j]);
				}
			}
			termCopy.stack = newArray;
			
			if(term.right!=null){
				term = term.right;
			}else{
				break;
			}
		}
		
		if(isShared){
			filterDateShared(newnewStack,year,month,day,true);
		}
	}
	
	console.log("Check 6");
	var new3Stack = new ThornStack();
	if(dateBefore.value==""){
		new3Stack = newnewStack;
		console.log("Check 7");
	}else{
		console.log("Check 8");
		name = name + "_Before" + dateBefore.value;
		var term = newnewStack.first;
		var split = dateBefore.value.split("-");
		var month = parseInt(split[1]);
		var day = parseInt(split[2]);
		var year = parseInt(split[0]);
		console.log(year);
		while(true){
			var termCopy = term.copy();
			for(var i =0;i<term.stack.length;i++){
				
				if(term.stack[i] == null){
				
				}else if(term.stack[i].year < year){
					
				}else if(term.stack[i].year == year){
					if(term.stack[i].month < month){
					
					}else if(term.stack[i].month == month){
						if(term.stack[i].day <= day){
							if(term.stack[i].pmid=="26147141"){
								console.log(term.stack[i].year);
							}
						}else{
							termCopy.count--;
							termCopy.stack[i] = null;
						}
					}else{
						termCopy.count--;
						termCopy.stack[i] = null;
					}
				}else{
					termCopy.count--;
					termCopy.stack[i] = null;
				}
			
			}
		
			if(termCopy.count > 0){
				new3Stack.add(term.name,termCopy);
			
			}
			var newArray = [];
			for(var j=0;j<termCopy.stack.length;j++){
				if(termCopy.stack[j]!=null){
					newArray.push(termCopy.stack[j]);
				}
			}
			termCopy.stack = newArray;
				
			if(term.right!=null){
				term = term.right;
			}else{
				break;
			}
		}
		if(isShared){
			filterDateShared(newnewStack,year,month,day,false);
		}
	}
	console.log("Check Final");
	makeTables(new3Stack,10);
	console.log("Check Final 2");
	if(!isArticle){
		makeDownloadableCSV(name,new3Stack);
	}
}
	
	
function compareNodeDate(benchmark, node){
	var date = new Date(node.year, node.month, node.day).getTime();		
	return date - benchmark;
}
// return if node date is before the benchmark
function noteDateBefore(benchmark, node){	
	return compareNodeDate(benchmark, node) < 0;
}
// return if node date is after the benchmark
function noteDateAfter(benchmark, node){
	return compareNodeDate(benchmark, node) > 0;
}


	
function errorHandler(e) {
	console.log(e);
}

function onInitFs(fs, withPmids){
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
				window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+fileName);
			}, false);
			var blob = new Blob([data],{type: 'text/plain'});
			fileWriter.write(blob);
			console.log("WRITTEN");
		},errorHandler);
	},errorHandler);
}

	
function makeDownloadableCSV(name,stack){
	
	$(".download-button").click(function(){
		var withPmids = this.id!="csv";
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs){onInitFs(fs,withPmids)}, errorHandler);
	});
	
	// var download = document.getElementById("csv");
	// download.onclick = function
		// window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		// window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs){onInitFs(fs,false)}, errorHandler);
	// }
	
	// var download2 = document.getElementById("csv-with-mpids");
	// download2.onclick = function(){
		// withPmids = true;
		// window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		// window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs2, errorHandler)	
	// }
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

function makeTables(stack,limit,index=0,type){
		
	var tableform = document.getElementById("tableform");
	$(tableform).find("tr").slice(1).remove();	//remove all tr except the first one

	if(stack.length==0){
		$(displayText).text("No Results");
		return;
	}
	
	var maintable = $(tableform).find("table")[0];
	
	var indexLimit = index+limit;
	if(indexLimit>stack.length){
		indexLimit = stack.length;
	}
	
	updateTableFooter(stack,limit,index, type);
	
	switch (type) {
		case 'connected':
			makeConnectedTermsTable(stack, index, indexLimit);
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
	
	if(index-limit < 0){
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
		if(check && check!=[] && keyC!=37 && keyC!=38 && keyC!=39 && keyC!=40){
			//console.log(check);
			//console.log(check.length);
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
		}else{
			//console.log(check);
		}
	});
}
	
//Table filter always includes "None". path-search intermediary step doesn't
function makeSTypes(parent, id, withNone){
	var select = document.createElement("select");
	select.id = id;
	
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
	
	parent.appendChild(select);
}
	
function makePageSections(){
	var thepage = document.getElementById("thepage");

	thepage.addEventListener('submit', function(e) {
		//console.log("Page Event Listener");
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
	$(downloadform).append('<button type="button" id="csv-with-mpids" class="download-button">CSV with pmids</button>');

	// filter fields
	var filterSection = document.getElementById("filterSection");
	makeSTypes(filterSection, "typeSelect", true);	
	$(filterSection).append('<button type="submit" id="filter-type-button">Filter</button>');
	$(filterSection).append('<p>Date After:<input id="dateAfterInput" type="date">'+ 
		'Date Before:<input id="dateBeforeInput" type="date"></p>');
		
	$("#mappedResults").append('<button onclick="showSubterms()">Click Here to see Subterms</button>');
}

function showLoader(){
	var thepage = document.getElementById("thepage");
	$(thepage).append('<img src="img/ajax-loader.gif" alt="Loading circle" id="loader">');
}