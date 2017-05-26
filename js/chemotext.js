var countER = 6;
var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;

var subTermMax = 0;
var subTermCount = 0; 
var subTerms = [];

function makeSynStack(){
	//console.log("StartSynStack");
	readTextFile("https://cors-anywhere.herokuapp.com/http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");
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
		url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
		accepts: "application/json; charset=UTF-8",	
		dataType:"json",
		contentType:"application/json",
		data: payload,
		type:"POST",
		success:function(data,xhr,status){ successFunc(data); },
		error:function(xhr,err,msg){
			console.log(xhr);
			console.log(err);
			console.log(msg);
			$("#loader").remove();
			tableform.innerHTML = "Connection to Neo4j Database rejected";
		}
	});
}
	
function filterStack(dropbox,stack,name){
		console.log("All Terms");
		console.log(stack.length);
		var dateAfter = document.getElementById("dateAfterInput");
		var dateBefore = document.getElementById("dateBeforeInput");
		var newStack = new ThornStack();
		console.log("Stack Length:"+ stack.length);
		if(!isArticle){
			var type = dropbox.value;
			if(type=="None"){
				console.log("Check -1");
				newStack = stack;
			}else if(type == "Disease" || type == "Chemical" || type == "Other"){
				console.log("Check -2");
				name = name+"_"+type;
				var term = stack.first;
				while(true){
					if(term.type == type){
						newStack.add(term.name,term.copy());
					}
					if(term.right!=null){
						term = term.right;
					}else{
						break;
					}
				}
			}else if(type=="Drug"){
				name = name+"_"+type;
				var term = stack.first;
				while(true){
					if(term.isDrug){
						newStack.add(term.name,term.copy());
					}
					if(term.right!=null){
						term = term.right;
					}else{
						break;
					}
				}
				
			}else{
				console.log("Check -3");
				name = name+"_"+type;
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
		}else{
			newStack = stack;
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
				filterDateAfterShared(newnewStack,year,month,day);
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
				filterDateBeforeShared(new3Stack,year,month,day);
			}
		}
		console.log("Check Final");
		makeTables(new3Stack,10);
		console.log("Check Final 2");
		if(!isArticle){
			makeDownloadableCSV(name,new3Stack);
		}
}
	
function filterDateAfterShared(stack,year,month,day){
	var benchmark = new Date(year,month,day).getTime();
	
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack1.length;i++){
			var node = term.stack1[i]
			var date = new Date(node.year, node.month, node.day).getTime();			
			if (date < benchmark){
				term.sharedCount1--;				
			}
		}
		term = term.right;
	}
	
	var term = stack.first;
	while(term != null){
		for(var i =0;i<term.stack2.length;i++){
			var node = term.stack2[i]
			var date = new Date(node.year, node.month, node.day).getTime();
			if (date < benchmark){
				term.sharedCount2--;				
			}
		}
		term = term.right;
	}
}
	
	
function filterDateBeforeShared(stack,year,month,day){
	var term = stack.first;
	while(true){
		for(var i =0;i<term.stack1.length;i++){
			if(term.stack1[i].year < year){
			
			}else if(term.stack1[i].year == year){
				if(term.stack1[i].month == month){
					if(term.stack1[i].day > day){
						term.sharedCount1--;
					}
				}else if(term.stack1[i].month > month){
					term.sharedCount1--;
				}
			}else{
				term.sharedCount1--;
			}
		}
		if(term.right!=null){
			term = term.right;
		}else{
			break;
		}
	}
	var term = stack.first;
	while(true){
		for(var i =0;i<term.stack2.length;i++){
			if(term.stack2[i].year < year){

			}else if(term.stack2[i].year == year){
				if(term.stack2[i].month < month){
				
				}else if(term.stack2[i].month == month){
					if(term.stack2[i].day <= day){
						
					}else{
						term.sharedCount2--;
					}
				}else{
					term.sharedCount2--;
				}
			}else{
				term.sharedCount2--;
			}
		}
		if(term.right!=null){
			term = term.right;
		}else{
			break;
		}
	}
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

	
function makeFilters(stack,name){
	var filterSection = document.getElementById("filterSection");
	while(filterSection.firstChild){
		filterSection.removeChild(filterSection.firstChild);
	}
	var select = "";
	
	makeSTypes(filterSection,"typeSelect",true);
	
	select = document.getElementById("typeSelect");
	
	var filterType = document.createElement("button");
	filterType.type = "submit";
	filterType.id = "download";
	filterType.innerHTML = "Filter";
	filterType.style.height = select.style.height;
	filterType.onclick = function(){ filterStack(select,stack,name); }
	filterSection.appendChild(filterType);

	//END OF TYPE FILTER
	var dateAfter = document.createElement("p");
	dateAfter.innerHTML = "Date After:";
	var dateAfterInput = document.createElement("input");
	dateAfterInput.id = "dateAfterInput";
	dateAfterInput.type = "date";
	dateAfterInput.style.marginLeft = 11;
	dateAfterInput.style.marginRight = 10;
	
	dateAfter.appendChild(dateAfterInput);
	filterSection.appendChild(dateAfter);
	
	dateAfter.innerHTML = dateAfter.innerHTML + " Date Before:";
	//dateAfter.appendChild(" Date Before:")
	var dateBefore = document.createElement("p");
	dateBefore.innerHTML = "Date Before:";
	var dateBeforeInput = document.createElement("input");
	dateBeforeInput.id = "dateBeforeInput";
	dateBeforeInput.type = "date";
	dateBeforeInput.style.marginLeft = 11;
	
	dateAfter.appendChild(dateBeforeInput);
	//filterSection.appendChild(dateBefore);
}

function makeConnectedTermsTable(stack, index, indexLimit){
	var tableform = document.getElementById("tableform");
	
	var node = stack.first;
	for(var i=0;i<index;i++){
		node = node.right;	//skip up to 'index'
	}

	for(var j=index;j<indexLimit;j++){
		if (node == null) break;
		// $(tableform).append('<tr><td>'+node.name+'</td>'+
		// '<td class="countCol">'+
		// '<button type="button" class="articleButton" onclick="openArticleList('+j+')">'+node.count+
		// '</button></td></tr>');
		
		$tr = $("<tr/>");
		$tr.append('<td>'+node.name+'</td>');
		$tr.append('<td class="countCol">');
		
		$button = $("<td/>").append( $("<button/>", {
			type: "button", 
			"class": "articleButton", 
			text: node.count, 
			click: function(node){ return function(){openArticleList(node);} }(node)	//CHECK THIS
		}));
		$tr.append($button);
		$(tableform).append($tr);

		node = node.right;
	}
	

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
	$(tableform).slice(1).remove();	//remove all tr except the first one

	if(stack.length==0){
		tableform.innerHTML = "No Results";
		return;
	}
	
	var maintable = $(tableform).find("table")[0];
	
	var indexLimit = index+limit;
	if(indexLimit>stack.length){
		indexLimit = stack.length;
	}
	
	updateTableFooter(stack,limit,index,tableform,maintable);
	
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
function updateTableFooter(stack,limit,index){
	$("#prev-arrow")[0].onclick = function(){makeTables(stack,limit,index-limit);}

	$("#table-limit-button")[0].onclick = function(){
		tableLimit = parseInt(limitInput.value);
		makeTables(stack,tableLimit,0);
	};
	
	$("#next-arrow")[0].onclick = function(){makeTables(stack,limit,index+limit);}

	$("#results-count").text(stack.length);
	
	if(index<=0){
		$("#prev-arrow").hide();
	}
	if(index>=stack.length){
		$("#next-arrow").hide();
	}
}

	
function inputSuggestion($inputSection, inputId){
	$inputSection.prepend('<datalist id="datalist-'+inputId+
		'"></datalist><input class="suggestion-bar" id="'+inputId+
		'" list="datalist-'+inputId+'">');
	
	$("#"+inputId).keyup(function(keyEvent){
		var inputTerm = $(this).val();
		console.log(inputTerm);
		var check = synStack.search(inputTerm);
		var keyC = keyEvent.keyCode;
		
		//console.log(keyC);
		if(check && check!=[] && keyC!=37 && keyC!=38 && keyC!=39 && keyC!=40){
			//console.log(check);
			//console.log(check.length);
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
	
function makeSTypes(parent,id,withNone=false){
	var select = document.createElement("select");
	select.id = id;
	select.style.margin = 0;
	select.style.padding = 2;
	if(withNone){
		var option4 = document.createElement("option");
		option4.innerHTML = "No Filter";
		option4.value = "None";
		select.appendChild(option4);
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
		console.log("Page Event Listerner");
		e.preventDefault();
	}, false);
	
	$(tableform).append('<img src="img/previous.png" class="table-arrow" id="prev-arrow">');
	$(tableform).append('<input value="'+tableLimit+'">');
	$(tableform).append('<button id="table-limit-button" type="submit">Set Table Limit</button>');	
	$(tableform).append('<img src="img/next.png" class="table-arrow" id="next-arrow">');
	$(tableform).append('<p>Total Count: <span id="results-count"></span></p>');

	var downloadform = document.getElementById("downloadform");
	$(downloadform).append('<button type="button" id="csv" class="download-button">View CSV</button>');
	$(downloadform).append('<button type="button" id="csv-with-mpids" class="download-button">CSV with pmids</button>');
}

function showLoader(){
	var thepage = document.getElementById("thepage");
	var loader = document.createElement("img");
	loader.src = "img/ajax-loader.gif";
	loader.alt = "Loading circle";
	loader.id = "loader";
	thepage.appendChild(loader);
}