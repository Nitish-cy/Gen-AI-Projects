/*
Implementation Plan
Stage 1: Indexing
1. Load the document - pdf,text - completed
2. Chunk the document
3. Generate vector Embeddings
4. Store the vector embeddings - vector db
Stage 2: Using the chatbot
1. Setup LLM
2. Add retrieval step
3. Pass input + relevant information to LLM
*/

import { indexTheDocument } from "./prepare.js";
const filePath='./Nitish_Profile.pdf';
indexTheDocument(filePath);
