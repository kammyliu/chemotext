SELECT t2.name as term_name,COUNT(m1.pmid) as pub_count FROM term_syn ts
JOIN term t1 ON ts.term_idx=t1.term_idx
JOIN mentions m1 ON t1.term_idx=m1.term_idx
JOIN mentions m2 ON m1.pmid=m2.pmid
JOIN term t2 ON m2.term_idx=t2.term_idx
WHERE ts.synonym=?
AND t1.term_idx<>t2.term_idx
GROUP BY t2.name
ORDER BY COUNT(m1.pmid) DESC;
