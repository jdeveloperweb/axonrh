-- Ensure OCR confidence column uses double precision to match entity mapping
ALTER TABLE admission_documents
    ALTER COLUMN ocr_confidence TYPE DOUBLE PRECISION
    USING ocr_confidence::DOUBLE PRECISION;
