There are three parts to the Question Engine

## Compressor

Compresses documents into a form that represents most important aspects earlier in the document and least important aspects later. Possibly some kind of variable-length feature embedding.

## Ranker

Function that takes a database of embeddings and question and ranks the database.

## Inferrer

Takes the question and document embeddings and intuits the intended meaning of the question to generate a response that is well-sourced by the documents.