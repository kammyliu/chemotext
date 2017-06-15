// Update terms, subterms, and MAPPED relationships


// set all isDrug to false
MATCH (n:Term) SET n.isDrug = FALSE;


// Read replaced terms
// columns (unlabeled): newTerm, isDeletion, oldTerm
USING PERIODIC COMMIT
LOAD CSV FROM  'file:///opt/local/neo4j/meshupdate/out/replaced-terms.txt' As line FIELDTERMINATOR '\t'
MATCH (n:Term{name: line[0]})	//match the old term
WITH n, line, count(n) as count
FOREACH(x IN CASE WHEN count>0 THEN [1] ELSE [] END |	//if the old term is there
	FOREACH(x IN CASE WHEN line[1]="1" THEN [1] ELSE [] END |	
		DETACH DELETE n		// if flag=1 delete node
	)
	FOREACH(x IN CASE WHEN line[1]="0" THEN [1] ELSE [] END |
		SET n.name = line[2]	// if flag=0 rename node
	)
);


// Read MeSH terms
// columns: name, type, subtype, entry, isDrug
USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM 'file:///opt/local/neo4j/meshupdate/out/mesh-terms.txt' As line FIELDTERMINATOR '\t'
MERGE (n:Term {name: line.name})	//create or match the term name
SET n.type = line.type, 
	n.subtype = line.subtype, 
	n.synonyms = split(line.entry, "|"),	//set as a list of strings
	n.isSubterm = false,
	n.isDrug = CASE WHEN line.isDrug="1" THEN true ELSE false END	//convert to boolean
;

	
// Read subterms
// columns: name, mainterm, entry, isDrug
USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM 'file:///opt/local/neo4j/meshupdate/out/subterms.txt' As line FIELDTERMINATOR '\t'
MATCH (main:Term{isSubterm: false}) WHERE main.name IN split(line.mainterm, "|")	//match all mapped MeSH terms
WITH line, main, count(main) as count_main, collect(main.type)[0] as main_type, collect(main.subtype)[0] as main_subtype
FOREACH(x IN CASE WHEN count_main>0 THEN [1] ELSE [] END |		//if at least one main term found
	MERGE (n:Term{name: line.name})		//create or match the term name
	MERGE (main)-[:MAPPED]->(n)		//create or match the MAPPED relationship for all mapped terms
	
	//arbitrarily choose the first MeSH term as the one whose type to match
	SET n.type = main_type, 	
		n.subtype = main_subtype,
		n.synonyms = split(line.entry, "|"),	//set as a list of strings
		n.isSubterm = true,
		n.isDrug = CASE WHEN line.isDrug="1" THEN true ELSE false END	//convert to boolean
);

// remove subterms with no terms mapped to them, and any MENTIONs
MATCH (n:Term{isSubterm: true})
WHERE size((:Term)-[:MAPPED]->(n))=0
DETACH DELETE n;

// remove faulty MAPPED relationships 
// e.g. a past subterm was promoted to a separate MeSH term and old mappings need to be removed
MATCH (n:Term)-[r:MAPPED]->(m:Term)
WHERE n.isSubterm OR not m.isSubterm
DELETE r;
