var isPath = true;

var thepage, input, tableform, selectBar, downloadform;

$(document).ready(function(){	
	makePageSections();

	inputSuggestion($("#inputSection"), "inputbar");
	
	makeSTypes($("#selectBar-section")[0],"selectBar");

	thepage = document.getElementById("thepage");
	input = document.getElementById("inputbar");
	tableform = document.getElementById("tableform");
	selectBar = document.getElementById("selectBar");
	downloadform = document.getElementById("downloadform");
	
	makeSynStack();
});



var triangleTerm;
function triangleSearch(){
	isShared = false;
	isPath = true;

	while(downloadform.firstChild){
		downloadform.removeChild(downloadform.firstChild);
	}
	var term = input.value;
	var term1 = synStack.get(term);

	if(term1 && term1.includes('|')){
		term1 = term1.split('|');
		term = term1[1]; //term1.mainTerm.name;
	}
	var type = selectBar.value;
	
	showLoader();

	tableform.innerHTML = "Looking for term: " + term ;
	console.log(term);
	console.log(type);	
	
	var checkbox = document.getElementById("mappedCheckbox");
	if(checkbox.checked){
		triangleTerm = term;
		var pay = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MAPPED]->(a) return a " , "parameters" : {"name": term}
			}]
		});
		queryNeo4j(pay,findTriangleSubTerms);
		
	}else{
		var data = "";
		if(type == "Disease" || type == "Other" || type == "Chemical"){
			data = JSON.stringify({				
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{type:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
				}]			
			});		
		}else{
			data = JSON.stringify({
				"statements" : [{
					"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m:Term{stype:{type}}) return m, a" , "parameters" : {"name": term, "type":type}
				}]			
			});
		}
		
		queryNeo4j(data,triangleSearchOnSuccess);
	}	
}
	
function triangleSearchOnSuccess(data){
	console.log("Finished Search");
	tableform.innerHTML = "Found " + type ;
	//tableform.innerHTML = JSON.stringify(data);
	var results = data["results"][0];
	//console.log(status);
	//tableform.innerHTML = results;
	var data2 = results["data"];
	var stack = new ThornStack();
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];

		var check = stack.get(name);
		
		if(!check){
			var term = new Term(name,type,stype);
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){term.isDrug=true;}
			stack.add(name,term);
			term.addArt(pmid,date,stack,title);
		}else{
			check.addArt(pmid,date,stack,title);
		}	
	}
	
	
	/*
	var term = stack.first;
	for (var i=countER; i> 0 ; i--){
		postRequest(term.name,selectBar.value,newStack,countER,isRunning)
		term = term.right;
	}*/
	var loader = document.getElementById("loader");
	thepage.removeChild(loader);
	
	var displayText = document.getElementById("displayText");
	displayText.innerHTML = "Choose the B Terms you want to search with";
	makeTables(stack,tableLimit,0);
	
	downloadform.innerHTML = "Choose the type of C Terms you want to search for"
	makeSTypes(downloadform,"triType");
	var selectBar2 = document.getElementById("triType");
	
	var newStack = new ThornStack();
	var isRunning = true;
	var button = document.createElement("button");
	button.innerHTML = "Finish Search";
	button.onclick = function(){
		isPath = false;
		
		$(tableform).find("th").first().remove();	//remove the first column
		
		var checkedTerms = [];
		var checkedString = "Your B Terms: ";
		var term = stack.first;
		var csvName = "";
		for(var i=0; i <stack.length;i++){
			if(term.isSelected){
				checkedTerms.push(term);
				checkedString = checkedString + term.name + ", ";
				csvName = csvName + "_" + term.name;
			}
			if(term.right==null){
				break;
			}
			term = term.right;
		}
		checkedString = checkedString + " Your C Term Type: " + selectBar2.value;
		displayText.innerHTML = checkedString;
		countER = checkedTerms.length;
		console.log(countER);
		for(var j=0;j<checkedTerms.length;j++){
			console.log("Post Request");
			term = checkedTerms[j];
			postRequest(term.name,selectBar2.value,newStack,countER,isRunning,csvName)
		}
	}
	downloadform.appendChild(button);
	//Make new  TypeBar and Search Button Here.
}	
	
function addTriangleSubTerms(data){
	var results = data["results"][0];
	var data2 = results["data"];
	var stack = simpleStack;
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];
		var type = data2[i]["row"][0]["type"];
		var stype = data2[i]["row"][0]["stype"];
		var date = data2[i]["row"][1]["date"];
		var pmid = data2[i]["row"][1]["pmid"];
		var title = data2[i]["row"][1]["title"];

		var check = stack.get(name);

		if(!check){
			var term = new Term(name,type,stype);
			
			var isDrug = data2[i]["row"][0]["isDrug"];
			if(isDrug=="true"){term.isDrug=true;}
			
			stack.add(name,term);
			term.addArt(pmid,date,stack,title);
		}else{
			check.addArt(pmid,date,stack,title);
		}	
	}
	
	console.log("FINISHED SUBTERM or TERM");
	subTermCount++;
	
	if(subTermCount==subTermMax){
		stack = simpleStack;
		var loader = document.getElementById("loader");
		thepage.removeChild(loader);
		
		var displayText = document.getElementById("displayText");
		displayText.innerHTML = "Choose the B Terms you want to search with";
		makeTables(stack,tableLimit,0);
	
		downloadform.innerHTML = "Choose the type of C Terms you want to search for"
		makeSTypes(downloadform,"triType");
		var selectBar2 = document.getElementById("triType");
		
		var newStack = new ThornStack();
		var isRunning = true;
		var button = document.createElement("button");
		button.innerHTML = "Finish Search";
		button.onclick = function(){
			isPath = false;
			var checkedTerms = [];
			var checkedString = "Your B Terms: ";
			var term = stack.first;
			var csvName = "";
			for(var i=0; i <stack.length;i++){
				if(term.isSelected){
					checkedTerms.push(term);
					checkedString = checkedString + term.name + ", ";
					csvName = csvName + "_" + term.name;
				}
				if(term.right==null){
					break;
				}
				term = term.right;
			}
			checkedString = checkedString + " Your C Term Type: " + selectBar2.value;
			displayText.innerHTML = checkedString;
			countER = checkedTerms.length;
			console.log(countER);
			for(var j=0;j<checkedTerms.length;j++){
				console.log("Post Request");
				term = checkedTerms[j];
				postRequest(term.name,selectBar2.value,newStack,countER,isRunning,csvName)
			}
		};
		
		downloadform.appendChild(button);					
	}
}

function findTriangleSubTerms(data){
	subTerms = [];
	var mappedResults = document.getElementById("mappedResults");
	var button = document.createElement("button");
	mappedResults.appendChild(button);
	button.onclick = showSubterms;
	button.innerHTML = "Click Here to see Subterms";
	var results = data["results"][0];
	var data2 = results["data"];
	simpleStack = new ThornStack();
	
	subTermCount = 0;
	subTermMax = data2.length + 1;
	console.log(subTermMax);
	var payload = JSON.stringify({
		"statements" : [{
			"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": triangleTerm}
		}]
	});
	queryNeo4j(payload,addSimpleSubtermData);
	
	for (var i=0; i< data2.length ; i++){
		var name = data2[i]["row"][0]["name"];	
		//mappedResults.innerHTML = mappedResults.innerHTML +  " | " + name;		
		subTerms.push(name);
		var payload = JSON.stringify({
			"statements" : [{
				"statement" : "match (n:Term{name:{name}})-[:MENTIONS]-(a)-[:MENTIONS]-(m) return m, a " , "parameters" : {"name": name}
			}]
		});
		queryNeo4j(payload,addSimpleSubtermData);			
	}	
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
				
				if(!check){
					var term = new Term(name,type,stype);
					stack.add(name,term);
					term.addArt(pmid,date,stack);
				}else{
					check.addArt(pmid,date,stack);
				}	
			}
			
			countER--;
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
