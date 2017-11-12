class Article{
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
	constructor(name,type,subtype,isDrug){
		this.name = name;
		this.type = type;
		this.subtype = subtype;
		this.isDrug = isDrug;
		this.sharedCount1 = 0;	// used for the "TermA only" part of Shared Terms search
		this.sharedCount2 = 0;	// used for the "TermB only" part of Shared Terms search
		this.articles = [];
	}

	copy(){
		var copy = new Term(this.name,this.type,this.subtype);
		copy.isDrug = this.isDrug;
		copy.sharedCount1 = this.sharedCount1;
		copy.sharedCount2 = this.sharedCount2;
		copy.articles = this.articles.slice()
		return copy;
	}
	
	addArticle(pmid, date, title){
		this.articles.push(new Article(pmid, date, title));
	}
}

/**
* Takes a sorted (case-insensitive) array of strings.
* Each string represents a term and (optionally) its synonym.
* The synonym is demarcated with |. 
*/
class TermBank {
	constructor(list){
		this.list = list;
		this.suggestCount = 5;	//the max number of suggestions complete() will return
	}
	
	// return synonym, or self if no synonym
	getSynonym(term){
		var index = this.getIndex(term, true);
		if (index == -1){
			return term;
		}
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

