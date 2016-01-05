# Gooey Neo Graph Explorer

This project is an attempt to make Neo4j graph databases usable without knowledge
of Cypher and, therefore, accessible to a broader range of users. It includes a 
UI for editing nodes and relationships, an "explorer" for searching, visualizing and traversing
your graphs, and a reports page where you can export data to CSV. 

### Wait, what's a graph database?

Traditional databases are built around the concept of tables: rows of data (records)
organized into columns (fields). A database can have multiple tables, which may 
or may not be related to one another. We call these "relational" databases, and 
they're a well-established standard for data management.

Graph databases take an entirely different approach, based on graph theory (scary
math). Each entity in your database--things like people, products, and so on--is
called a "node". Nodes have properties that describe themselves, and only 
themselves (no references to other things in your database). They can then be connected 
to other nodes through "relationships." This type of structure is very fluid and 
allows for multi-dimensional data modeling that traditional databases aren't very 
good at.

Here's an example. Let's say you're trying to make a database of employees that 
shows who works for whom and in what departments. Simple, right? Well, assuming
your organization is very hierarchically structured, yes. Every person would have
one person to whom they report and they would be housed in one department. A 
table with employees having a column for their manager's id and another for their 
department ID (referencing another table of department data) would do the job. 

In the real world it's not necessarily that simple. I might report to both the VP
of Marketing and the Chief Systems Architect and divide my time between those departments.
You can model that in a relational database by creating tables that describe 
the relationships, and that works well enough for simple cases *where you know
ahead of time what might be related to what*. 

With a graph, you can relate any node to any other node. A person can report to 
another person or a department, or to many people. Or to a sofa, if that's your
reality. Doesn't matter. And if you reality changes over time and people start
reporting to their pets (could happen. . .) you don't need to create a new 
table for pets and another relating people to pets. You just add a node for each
pet and relationships to their people.

I know, pretty abstract. In the real world, graphs are used for things like 
recommendation engines (you bought x, y and z; others who bought those things
also bought a, b and c; maybe you'd like to also?), social networks (you know
so and so and are interested in such and such; you might want to meet who's his 
face who shares your interest in such and such), and even finding the shortest
route between two cities (cities as nodes, roads as relationships).

### OK, so what's Neo4j?

[Neo4j](http://neo4j.com) is a popular graph database engine. It uses its own
language, called Cypher, for querying and modifying data. Neo4j ships with a very 
slick, browser-based GUI for running Cypher queries and visualizing the output.
It comes in free and commercial versions and can run on any system that can run
Java. I think.

### If Neo4j's query browser is so great, why this project?

See the first paragraph. Basically I got sick of typing Cypher queries all the 
time and wanted an easier way to get data into the system. 

### Due Credit

You'll notice a lot of similarities between my visualizer and Neo4j's. That's 
because I'm flagrantly copying their methodology. "Why re-invent the wheel when 
you can reverse engineer it?" I say. Seriously, the team at Neo4j did it right
and I give them all due credit as the inspiration for my pale imitation.


### License

