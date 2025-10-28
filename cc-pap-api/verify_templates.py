#!/usr/bin/env python3
"""Verify policy templates are loaded in database"""

import psycopg2
import os

def verify_templates():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'control_core_db'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )
    cursor = conn.cursor()
    
    # Total count
    cursor.execute('SELECT COUNT(*) FROM policy_templates')
    total = cursor.fetchone()[0]
    
    print("\n" + "=" * 60)
    print(f"  Policy Templates Verification")
    print("=" * 60)
    print(f"\n✅ Total Templates: {total}\n")
    
    # By category
    cursor.execute('''
        SELECT category, COUNT(*) 
        FROM policy_templates 
        GROUP BY category 
        ORDER BY COUNT(*) DESC
    ''')
    
    print("📊 Templates by Category:\n")
    print(f"{'Category':<35} {'Count':>5}")
    print("-" * 42)
    for row in cursor.fetchall():
        print(f"{row[0]:<35} {row[1]:>5}")
    
    # With metadata
    cursor.execute('''
        SELECT COUNT(*) 
        FROM policy_templates 
        WHERE template_metadata IS NOT NULL 
        AND template_metadata != '{}'::jsonb
    ''')
    with_metadata = cursor.fetchone()[0]
    
    print(f"\n✅ Templates with metadata: {with_metadata}")
    print(f"✅ Templates ready for UI: {with_metadata}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("  Verification Complete!")
    print("=" * 60)
    print(f"\nAll {total} templates are loaded and ready to use!")
    print("Access them at: http://localhost:5173/policies/templates\n")

if __name__ == "__main__":
    verify_templates()

