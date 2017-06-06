
class Art{
	constructor(pmid,date,title){
		this.pmid = pmid;
		this.title = title;
		if(date==null){
			this.date = "Unknown";
		}else{
			this.date = date.toString();
			this.year = parseInt(this.date.substring(0,4));
			this.month = parseInt(this.date.substring(4,6));
			this.day = parseInt(this.date.substring(6,8));
		}
	}
	
	// Return title if there is one. Otherwise, return pmid
	getTitleOrId(){
		if (this.title != null){
			return this.title;
		} else {
			return this.pmid;
		}
	}
}

class Term {
	constructor(name,type,stype){
		this.name = name;
		this.type = type;
		this.stype = stype;
		this.isDrug = false;
		
		//var isSelected = false;
		//var isSynonym = false;
		//var mainTerm = null;
		
		this.sharedCount1 = 0;
		this.sharedCount2 = 0;
		
		this.articles = [];
	}

	copy(){
		var copy = new Term(this.name,this.type,this.stype);
		copy.count = this.count;
		copy.isDrug = this.isDrug;
		copy.stack = this.stack.slice();
		copy.sharedCount1 = this.sharedCount1;
		copy.stack1 = this.stack1;
		copy.stack2 = this.stack2;
		copy.sharedCount2 = this.sharedCount2;
		
		copy.articles = this.articles.slice()

		return copy;
	}
	
	addArticle(pmid, date, title){
		this.articles.push(new Art(pmid, date, title));
	}
}

	
class TermBank {
	
	// takes a sorted (case-insensitive) array of strings, with synonyms demarcated by |. Terms have only 0 or 1 synonyms
	constructor(list){
		this.list = list;
		this.suggestCount = 5;	//the max number of suggestions complete() will return
	}
	
	// return synonym, or self if no synonym
	getSynonym(index){
		//console.log(index);
		var entry = this.list[index];
		
		if (entry.includes('|')){
			entry = entry.split('|')[1];
		} 
		return entry; 
	}
	
	// returns an array of autocomplete options, with length up to this.suggestCount
	complete(prefix){		
		var options = [];
		var index = this.getIndex(prefix, false);
		options.startIndex = index;		//see getDataIndex() in chemotext.js for explanation of extra field
		
		if (index > -1){
			for (var i=0; i<this.suggestCount && index<this.list.length && this.isPrefix(prefix, this.list[index]); i++){
				var entry = this.list[index++];
				if (entry.includes('|')){
					entry = entry.split('|')[0];
				} 
				options.push(entry);
			}
		} 
		
		return options;
	}	
	
	// If 'exact', get the index of the first item that is equal to the target (case-insensitive)
	// If not 'exact', it can also just begin with the target
	getIndex(target, exact) {
		target = target.toUpperCase();
		
		//binary search
		var low = 0, high = this.list.length - 1, i, comp;
		while (low <= high) {
			i = Math.floor((low + high) / 2);
			comp = this.list[i].toUpperCase();
	
			if (comp < target){ low = i + 1; continue; }
			if (comp > target) { high = i - 1; continue; }
			return i;
		}

		if (!exact && this.isPrefix(target, this.list[low])){
			return low;
		} 
		
		//split off the term without its synonym
		comp = this.list[low].toUpperCase();
		if (comp.includes('|')){
			comp = comp.split('|')[0];
		}
		if (comp === target){
			return low;
		}
		return -1;
	}
	
	// return whether the first argument is a prefix of the second. Case-insensitive
	isPrefix(prefix, string){
		return string.toUpperCase().substring(0, prefix.length) === prefix.toUpperCase();
	}
}

