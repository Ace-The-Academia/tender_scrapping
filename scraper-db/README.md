# Tender Intelligence API

The project runs a FastAPI application with persistent tender records and a self-hosted [Ollama](https://ollama.com/) AI runtime. The application only calls the runtime over Docker's private service network; it does not require a cloud AI key.

See [API_CONTRACT.md](API_CONTRACT.md) for the frontend/backend endpoint contract, inputs, outputs, and integration notes.

## Start the stack

```powershell
docker compose up --build -d
docker compose exec ollama ollama pull llama3.2:3b
```

The first command starts the API at `http://localhost:8000`; the second downloads the configured language model into the persistent `ollama-data` volume. Model downloads are deliberately separate from container images so changing models does not rebuild the application.

## Tender workflow

Create a tender record:

```powershell
$tender = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/tenders" -ContentType "application/json" -Body '{"title":"Supply of office equipment","organisation":"Example Municipality","description":"Supply and deliver computers and office equipment. Submit a valid tax clearance certificate.","closing_date":"2026-10-31"}'
```

Analyse that tender with the configured model:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/tenders/$($tender.id)/analyse"
```

The response contains a summary, requirements, risks, and recommended next steps. `GET /api/tenders` lists saved records, and `GET /api/tenders/{id}` retrieves a tender and its latest AI analysis.

## Business profiles and tender matching

Create a business profile containing the services, areas, and compliance information that the AI needs to assess opportunities:

```powershell
$business = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/business-profiles" -ContentType "application/json" -Body '{"business_name":"Example Supplies (Pty) Ltd","description":"Supplier of office technology and equipment to public-sector organisations.","industries":["Technology","Office Solutions"],"services":["Laptop supply","Printer supply","Office equipment delivery"],"service_areas":["Gauteng","National"],"certifications":["CSD registered","Valid tax clearance"]}'
```

Compare that business with a tender:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/tenders/$($tender.id)/match/$($business.id)"
```

The matching response includes a suitability score, matching capabilities, gaps or risks, and next steps. Use `GET /api/business-profiles` to view the collected profiles.

## Generic AI endpoint

```powershell
Invoke-RestMethod -Method Post http://localhost:8002/api/ai/generate `
  -ContentType 'application/json' `
  -Body '{"prompt":"Summarise this tender notice: ..."}'
```

`GET http://localhost:8002/health` reports whether the AI runtime is reachable. Set `AI_MODEL`, `OLLAMA_BASE_URL`, `AI_REQUEST_TIMEOUT_SECONDS`, and `DATABASE_PATH` in a local `.env` file when needed.

## Ask questions about a PDF

The AI service extracts selectable text from uploaded PDFs with pdfplumber. Uploads are limited to 15 MB and 200 pages, and the AI receives up to 80,000 extracted characters. Scanned/image-only PDFs need OCR before their text can be used.

Extract text without sending it to the model:

```powershell
curl.exe -F "file=@C:\path\to\tender.pdf" http://localhost:8002/api/ai/pdf/extract
```

Ask a question about the PDF:

```powershell
curl.exe -F "file=@C:\path\to\tender.pdf" `
  -F "question=What are the mandatory eligibility requirements?" `
  http://localhost:8002/api/ai/pdf/ask
```

Both endpoints are also available in the interactive API docs at `http://localhost:8002/docs`. Rebuild the AI service after adding the dependencies with `docker compose up --build -d ai`.
