import sys
import os

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        "../.."
    )
)

from app.rag.retriever import retrieve

query = "Is AWD worth buying in India?"

results = retrieve(query)

print("\nRESULTS\n")

for r in results:

    print("=" * 50)

    print(r["title"])

    print()

    print(
        r["chunk_text"][:300]
    )

    print()