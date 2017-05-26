var countER = 6;
var tableLimit = 10;
var synStack = new ThornStack(withCountCode=false);
synStack.extra = false;
	
function makeSynStack(){
	//console.log("StartSynStack");
	readTextFile("http://chemotext.mml.unc.edu/synstack.json",reconstructSynStack,"\r\n");
	//readTextFile("http://chemotext.mml.unc.edu/AllMainTerms.txt",makeSynStack2,"\r\n");
}
	
function reconstructSynStack(jsonObj){
	console.log("Getting Ready to Parse JSON");
	synStack.thornstack = JSON.parse(jsonObj)
	console.log("parsed JSON");
}	
	
function makeSynStack2(allTerms){
		console.log("Start SynStack2");
		//console.log(allTerms[0]);
		for(var i=0;i<allTerms.length;i++){
			var name = allTerms[i];
			var term = name; //new Term(name,"","");
			synStack.add(name,term);
		}
		console.log("Starting Synonyms");
		// open SynonymList.txt  add ALL To Thornstack
			//Set Its isSynonym and mainTerm as well
		readTextFile("http://chemotext.mml.unc.edu/SynonymList.txt",makeSynStack3,"\r\n");
	
	}
function makeSynStack4(newTerms){
	console.log("at synStack4");
	for(var i=0;i<newTerms.length;i++){
			var name = newTerms[i];
			var term = name; //new Term(name,"","");
			synStack.add(name,term);
		}
	readTextFile("http://chemotext.mml.unc.edu/newSubstanceSynList.txt",makeSynStack5,"\r\n");
}
	
function makeSynStack3(synTerms){
	console.log("at synStack3");
	for(var i=0;i<synTerms.length;i++){
		var name = synTerms[i];
		var split = name.split('\t');
		var check = synStack.get(split[0]);
		if(check!=false){
			var term = split[1]+"|"+split[0];
			synStack.add(split[1],term);
		}
	}
	readTextFile("http://chemotext.mml.unc.edu/substance_list.txt",makeSynStack4,"|\r\n");
}

function makeSynStack5(synTerms){
	console.log("at synStack5s");
	console.log(synTerms.length);
	for(var i=0;i<synTerms.length;i++){
		var name = synTerms[i];
		var split = name.split('\t');
		var term = split[1]+"|"+split[0];
		synStack.add(split[1],term);
		
	}
	console.log("Here Now");
		var data = JSON.stringify(synStack.thornstack);
	console.log("loading array");
	
var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
window.open(url, 'synstack.json');
console.log("Some problem");
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


var subTermMax = 0;
var subTermCount = 0; 
var subTerms = [];

function showSubterms(){
	var html = "<html><head><title>" + "Subterms" + "</title></head><body>";
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
            success:function(data,xhr,status)
            {
				successFunc(data);
			 },
            error:function(xhr,err,msg){
                console.log(xhr);
                console.log(err);
                console.log(msg);
				var loader = document.getElementById("loader");
				thepage.removeChild(loader);
				tableform.innerHTML = "Connection to Neo4j Database rejected";
            }
		});
}
	
	
function postRequest(term,type,stack,count,isRunning,csvName){
		var thepage = document.getElementById("thepage");
		var input = document.getElementById("inputbar");
		var tableform = document.getElementById("tableform");
		var selectBar = document.getElementById("selectBar");
		var downloadform = document.getElementById("downloadform");
		
		var data = "";
		if(type == "Disease" || type == "Other" || type == "Chemical"){
		
			data = JSON.stringify({
			
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{type:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
				}]
        
            });
		
		}else{
			data = JSON.stringify({
			
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[]-(a)-[]-(m:Term{stype:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
				}]
        
            });
		}
		
		

		
		$.ajax({ //443 works.
            url: "http://chemotext.mml.unc.edu:7474/db/data/transaction/commit",
			
            accepts: "application/json; charset=UTF-8",
			
            dataType:"json",
			contentType:"application/json",
			//headers: { "X-Stream": "false" },
			
            data: data,
            type:"POST",
            success:function(data,xhr,status)
            {
				console.log("Finished Search");
				//tableform.innerHTML = "Processing Results: " + JSON.stringify(data) ;
				//tableform.innerHTML = JSON.stringify(data);
				var results = data["results"][0];
				//tableform.innerHTML = results;
				var data2 = results["data"];
				for (var i=0; i< data2.length ; i++){
					var name = data2[i]["row"][0]["name"];
					var type = data2[i]["row"][0]["type"];
					var stype = data2[i]["row"][0]["stype"];
					var date = data2[i]["row"][1]["date"];
					var pmid = data2[i]["row"][1]["pmid"];
					var check = stack.get(name);
					
					if(check==false){
						var term = new Term(name,type,stype);
						stack.add(name,term);
						term.addArt(pmid,date,stack);
					}else{
						check.addArt(pmid,date,stack);
					}	
				}
				
				
				countER = countER - 1;
				tableform.innerHTML = "Percent Done: " + (100-(countER*20)); 
				console.log("Count: "+countER);
				if(countER==0){
					isRunning = false;
					console.log("FINISHED");
					console.log(stack.length)

				//var loader = document.getElementById("loader");
				//thepage.removeChild(loader);
		
					
					makeTables(stack,tableLimit);
					makeDownloadableCSV(input.value+"_Path"+csvName,stack);
				}
				
				
			 },
            error:function(xhr,err,msg){
                console.log(xhr);
                console.log(err);
                console.log(msg);
				
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
									console.log("Yar har har");
									console.log(term.stack[i].year);
								}
							}else{
								//console.log("Flourbags");
								termCopy.count--;
								termCopy.stack[i] = null;
							}
						}else{
							//console.log("Plumbags");
							termCopy.count--;
							termCopy.stack[i] = null;
						}
					}else{
						//console.log("Moneybags");
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
		console.log("Check Final 3");
	
	}
	
function filterDateAfterShared(stack,year,month,day){
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack1.length;i++){
					if(term.stack1[i].year > year){
					
					}else if(term.stack1[i].year == year){
						if(term.stack1[i].month > month){
						
						}else if(term.stack1[i].month == month){
							if(term.stack1[i].day >= day){
								
							}else{
								term.sharedCount1--;
							
							}
						}else{
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
					if(term.stack2[i].year > year){
					
					}else if(term.stack2[i].year == year){
						if(term.stack2[i].month > month){
						
						}else if(term.stack2[i].month == month){
							if(term.stack2[i].day >= day){
								
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
	
	
function filterDateBeforeShared(stack,year,month,day){
			var term = stack.first;
			while(true){
				for(var i =0;i<term.stack1.length;i++){
					if(term.stack1[i].year < year){
					
					}else if(term.stack1[i].year == year){
						if(term.stack1[i].month < month){
						
						}else if(term.stack1[i].month == month){
							if(term.stack1[i].day > day){
								term.sharedCount1--;
							}
						}else{
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
	
	
function makeDownloadableCSV(name,stack){
		var downloadform = document.getElementById("downloadform");
		while(downloadform.firstChild){
			downloadform.removeChild(downloadform.firstChild);
		}
	
				var download = document.createElement("button");
				download.type = "button";
				download.id = "download";
				download.style.width = 150;
				download.innerHTML = "View CSV";
				function errorHandler(e) {
					console.log(e);
				}
				function onInitFs(fs){
					console.log('Opened File System:' + fs.name);
					fs.root.getFile(name+"_chemotext.csv",{create:true}, function(fileEntry){
					
						fileEntry.createWriter(function(fileWriter){
							var split = name.split("_");
							var data = "";
							if(isShared){
								data = "Term \t Both \t" + split[0] + "\t" + split[1] + "\n";
							}
							var node = stack.first;
							for(var j=0;j<stack.length;j++){
								var arts = "";
										
								data = data + node.name+";"+node.count;
								if(isShared){
									data = data + "\t" + node.sharedCount1 + "\t" + node.sharedCount2; 
								}
								data = data + "\n";
								if(node.right==null){
									break;
								}
								node = node.right;
							}
							
							fileWriter.addEventListener("writeend", function() {
								window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+name+"_chemotext.csv");
							}, false);
							var blob = new Blob([data],{type: 'text/plain'});
							fileWriter.write(blob);
							console.log("WRITTEN");
						},errorHandler);
					},errorHandler);
				}
				download.onclick = function(){
				
					window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs, errorHandler);
					
				}
				downloadform.appendChild(download);
				
				var section2 = document.createElement("p");
				var download2 = document.createElement("button");
				download2.type = "button";
				download2.id = "download";
				download2.style.width = 150;
				download2.innerHTML = "CSV with pmids";
				function onInitFs2(fs){
					console.log('Opened File System:' + fs.name);
					fs.root.getFile(name+"_pmids_chemotext.csv",{create:true}, function(fileEntry){
					
						fileEntry.createWriter(function(fileWriter){
							
							data = "";
							var node = stack.first;
							for(var j=0;j<stack.length;j++){
								var arts = "";
								for(var k=0;k<node.stack.length;k++){
									arts = arts+"\t"+node.stack[k].pmid;
								}		
								data = data + node.name+";"+node.count+arts+"\n";
								
								if(node.right==null){
									break;
								}
								node = node.right;
							}
							
							fileWriter.addEventListener("writeend", function() {
								// navigate to file, will download
							//location.href = fileEntry.toURL();
								window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+name+"_pmids_chemotext.csv");
							}, false);
							var blob = new Blob([data],{type: 'text/plain'});
							fileWriter.write(blob);
							//var blob = new Blob(["Hoi"],{type: 'text/plain'});
							//fileWriter.write(blob);
							console.log("WRITTEN");
						},errorHandler);
					},errorHandler);
				}
				
				download2.onclick = function(){
					window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs2, errorHandler)	
				}
				section2.appendChild(download2);
				downloadform.appendChild(section2);
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

function makeTables(stack,limit,index=0){
		
		var tableform = document.getElementById("tableform");
		while(tableform.firstChild){
			tableform.removeChild(tableform.firstChild);
		}
		
		if(stack.length==0){
			tableform.innerHTML = "No Results";
			console.log("Table Empty");
			return;
		}
		var maintable = document.createElement("Table");
		var rowheading = document.createElement("TR");
		if(isPath){
			var headcol3 = document.createElement("TD");
			headcol3.className = "countCol";
			rowheading.appendChild(headcol3);

		}
		if(isArticle){
			var headcol1 = document.createElement("TD");
			headcol1.innerHTML = "Articles";
			headcol1.style.textAlign = "center";
			rowheading.appendChild(headcol1);

		}else{
			var headcol1 = document.createElement("TD");
			var headcol2 = document.createElement("TD");
			headcol1.innerHTML = "Terms";
			headcol2.innerHTML = "Count";
			headcol2.style.textAlign = "center";
			headcol2.className = "countCol";
			rowheading.appendChild(headcol1);
			rowheading.appendChild(headcol2);
		}

		if(isShared){
			var headcol3 = document.createElement("TD");
			var headcol4 = document.createElement("TD");
			headcol3.className = "countCol";
			headcol4.className = "countCol";
			var inputbar = document.getElementById("inputbar");
			var inputbar2 = document.getElementById("inputbar2");
			headcol2.innerHTML = "Same Article";
			headcol3.innerHTML = inputbar.value + " Only";
			headcol4.innerHTML = inputbar2.value + " Only";
			rowheading.appendChild(headcol3);
			rowheading.appendChild(headcol4);
		}
		
		maintable.appendChild(rowheading);
		
		
		var indexLimit = index+limit;
		if(indexLimit>stack.length){
			indexLimit = stack.length;
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
									if(node.stack[i]==null){
									}else{
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
			
			//table1.appendChild(newrow);
			maintable.appendChild(newrow);
		} 
		
		maintable.className = "center";
		//maincol1.appendChild(table1);		
		
		//mainrow.appendChild(maincol1);
		//mainrow.appendChild(maincol3);
		
		//maintable.appendChild(mainrow);
		//maintable.style.textAlign = "center";
		//maintable.style.paddingLeft = "540px";
		//maintable.style.marginLeft = "35%";
		//maintable.style.marginRight = "35%";
		//maintable.style.width = "40%";
		
		//tableform.style.textAlign = "center";
		//tableform.paddingLeft = "30px";
		
		tableform.appendChild(maintable);
		addTableNext(stack,limit,index,tableform,maintable);
		
		var p = document.createElement("p");
		p.innerHTML = "Total Count: " + stack.length;
		tableform.appendChild(p);
		
		
	}
function addTableNext(stack,limit,index,tableform,table){
		

			var diagram = document.createElement("img");
			diagram.src = "previous.png";
			diagram.style.width = 20;
			diagram.style.height = 20;
			diagram.style.marginRight = 20;
			diagram.onclick = function(){makeTables(stack,limit,index-limit);}
			tableform.appendChild(diagram);
			addTableLimit(stack,tableform);

			var diagram2 = document.createElement("img");
			diagram2.src = "next.png";
			diagram2.style.width = 20;
			diagram2.style.height = 20;
			diagram2.style.marginLeft = 20;
			diagram2.onclick = function(){makeTables(stack,limit,index+limit);}
			tableform.appendChild(diagram2);
	
	
	
		if(index<=0){
			diagram.style.visibility = "hidden";

		}else if(index>=stack.length){
			diagram2.style.visibility = "hidden";
		
		}

	
	}
function addTableLimit(stack,tableform){
	var limitInput = document.createElement("input");
	limitInput.value = tableLimit;
	tableform.appendChild(limitInput);
	var limitButton = document.createElement("button");
	tableform.appendChild(limitButton);
	limitButton.innerHTML = "Set Table Limit";
	limitButton.type = "submit";
	limitButton.onclick = function(){
		tableLimit = parseInt(limitInput.value);
		makeTables(stack,parseInt(limitInput.value),0)
	}
}
	
	
function inputSuggestion($inputSection, inputId){
	$inputSection.prepend('<datalist id="datalist-'+inputId+
		'"></datalist><input class="suggestion-bar" id="'+inputId+
		'" list="datalist-'+inputId+'">');
	
	$("#"+inputId).keyup(function(keyEvent){
		var input = $(this).val();
		var check = synStack.search(input);
		
		var keyC = keyEvent.keyCode;
		//console.log(keyC);
		if(check!=false && check!=[] && keyC!=37 && keyC!=38 && keyC!=39 && keyC!=40){
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
		"Chemical Actions and uses",
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
}

