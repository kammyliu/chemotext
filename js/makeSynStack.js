readTextFile("http://chemotext.mml.unc.edu/AllMainTerms.txt", makeSynStack2, "\r\n");
	
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

function makeSynStack3(synTerms){
	console.log("at synStack3");
	for(var i=0;i<synTerms.length;i++){
		var name = synTerms[i];
		var split = name.split('\t');
		var check = synStack.get(split[0]);
		if(check){
			var term = split[1]+"|"+split[0];
			synStack.add(split[1],term);
		}
	}
	readTextFile("http://chemotext.mml.unc.edu/substance_list.txt",makeSynStack4,"|\r\n");
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

