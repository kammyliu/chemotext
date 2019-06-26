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

/* Get search terms from url, returns array of terms*/
function getInputFromURL(url){
    var rawURL = decodeURI(url);
    var queryString = rawURL.split('?')[1];

    if (queryString) {
        return JSON.parse(queryString.split('=')[1]);
                                                     
    } else {
        return;
    }
}

/* Query the database */
function queryNeo4j(payload,successFunc){
	console.log(payload);
	$.ajax({
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
		var row = data[i].row;
		
		var term = row[0];
		var newTerm = new Term(term["name"], term["type"], term["subtype"], term["isDrug"]);
	
		var articles = row[1];
		for (var j=0; j<articles.length; j++){
			var a = articles[j];
			newTerm.addArticle(a["pmid"], a["date"], a["title"]);
		}
		if (withSharedCounts){
			newTerm.sharedCount1 = row[2];
			newTerm.sharedCount2 = row[3];
		}
		results.push(newTerm);
	}
	return results;
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
	var fileName = name + (withPmids ? "_pmids_chemotext.csv" : "_chemotext.csv");
	fs.root.getFile(fileName,{create:true}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter){
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
						arts = arts+"\t"+node.articles[k].pmid;
					}	
				}
				data = data + node.name + ";" + node.articles.length + arts;
				if(SEARCH_TYPE == "shared" && !withPmids){ 
					data = data + "\t" + node.sharedCount1 + "\t" + node.sharedCount2; 
				}
				data += "\n";
			}
			fileWriter.addEventListener("writeend", function() {
				window.open("filesystem:http://chemotext.mml.unc.edu/temporary/"+fileName);
			}, false);
			var blob = new Blob([data],{type: 'text/plain'});
			fileWriter.write(blob);
		}, errorHandler);
	}, errorHandler);
}

/* Filters the results table. Rebuilds the table and updates the CSV download handler */
function filterStack(dropbox,stack,name){
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
	makeTables(newStack,tableLimit,0);
	
	if(SEARCH_TYPE!="article"){
		setDownloadHandler(name,newStack);
	}
}
	
/* Filters the input stack by type and returns a new stack */
function filterType(stack, key){
	var type = MeshTree[key];
	var condition;
	if (type.isFlag){
		condition = function(term){return term[type.flagName];};
	} else if (type.isMainType){
		condition = function(term){return term.type==key;};		
	} else {
		condition = function(term){return term.subtype==key;};
	}
	
	var newStack = [];	
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
function getQueryTypeFilter(key){
	var typeFilter="";	//no type filter
	if (key){
		var type = MeshTree[key];
		if (type.isFlag){
			typeFilter = ":Term{"+type.flagName+":true}"
		} else if (type.isMainType){
			typeFilter = ":Term{type:{type}}";				
		} else {
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
