"""
Database initialization script.
Run this to create/reset the grievance.db with the NEW separated profile tables
and seed it with all existing data.
"""

import sqlite3, uuid, hashlib, json, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'grievance.db')

def hp(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def init():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Drop ALL existing tables to force a clean slate with the new architecture
    print("Dropping old tables...")
    for t in ['notifications','timeline','complaints','users', 'citizen_profiles', 'officer_profiles', 'admin_profiles']:
        c.execute(f'DROP TABLE IF EXISTS {t}')

    print("Creating new separated tables...")
    # 1. Central Auth Table
    c.execute("""CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    # 2. Separated Profile Tables
    c.execute("""CREATE TABLE admin_profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    c.execute("""CREATE TABLE citizen_profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    c.execute("""CREATE TABLE officer_profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        department TEXT,
        assigned_categories TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )""")

    # 3. Complaints, Timeline, Notifications (Unchanged structure)
    c.execute("""CREATE TABLE complaints (
        id TEXT PRIMARY KEY,
        ticket_id TEXT UNIQUE NOT NULL,
        citizen_id TEXT,
        citizen_name TEXT,
        citizen_email TEXT,
        citizen_phone TEXT,
        category TEXT NOT NULL,
        subcategory TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        image_filename TEXT,
        ai_summary TEXT,
        auto_reply TEXT,
        assigned_to TEXT,
        assigned_officer_name TEXT,
        resolution TEXT,
        ai_report TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
    )""")

    c.execute("""CREATE TABLE timeline (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT,
        actor_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        complaint_id TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    print("Seeding users into new separated tables...")
    # ── Seed users ──────────────────────────────────────────────
    # Format: id, name, email, password, role, phone, address, dept, categories
    seeds = [
        (str(uuid.uuid4()), 'System Administrator',  'admin@grievance.gov',         hp('admin123'),   'admin',   None,         None,                 'IT Administration', None),
        (str(uuid.uuid4()), 'Rajesh Kumar',           'officer@grievance.gov',       hp('officer123'), 'officer', '9876543211', None,                 'Water Supply',      json.dumps(['water_supply'])),
        (str(uuid.uuid4()), 'Priya Sharma',           'priya.officer@grievance.gov', hp('officer123'), 'officer', '9876543212', None,                 'Electricity',       json.dumps(['electricity'])),
        (str(uuid.uuid4()), 'Amit Verma',             'amit.officer@grievance.gov',  hp('officer123'), 'officer', '9876543213', None,                 'Road Maintenance',  json.dumps(['road_maintenance','street_lighting'])),
        (str(uuid.uuid4()), 'Sunita Patel',           'sunita.officer@grievance.gov',hp('officer123'), 'officer', '9876543214', None,                 'Sanitation',        json.dumps(['sanitation'])),
        (str(uuid.uuid4()), 'Rahul Singh',            'citizen@example.com',         hp('citizen123'), 'citizen', '9876543210', '123 MG Road, Delhi', None,                None),
    ]
    
    for s in seeds:
        uid, name, email, pwd, role, phone, address, dept, cats = s
        # 1. Insert into base users table
        c.execute('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)', (uid, email, pwd, role))
        
        # 2. Insert into specific profile tables
        if role == 'admin':
            c.execute('INSERT INTO admin_profiles (user_id, name) VALUES (?,?)', (uid, name))
        elif role == 'officer':
            c.execute('INSERT INTO officer_profiles (user_id, name, phone, department, assigned_categories) VALUES (?,?,?,?,?)', (uid, name, phone, dept, cats))
        elif role == 'citizen':
            c.execute('INSERT INTO citizen_profiles (user_id, name, phone, address) VALUES (?,?,?,?)', (uid, name, phone, address))

    # Helper to get seeded IDs for complaints
    def get_user(email, role):
        if role == 'officer':
            c.execute("SELECT u.id, o.name FROM users u JOIN officer_profiles o ON u.id = o.user_id WHERE u.email=?", (email,))
        elif role == 'citizen':
            c.execute("SELECT u.id, cp.name FROM users u JOIN citizen_profiles cp ON u.id = cp.user_id WHERE u.email=?", (email,))
        return c.fetchone()

    rajesh = get_user('officer@grievance.gov', 'officer')
    priya  = get_user('priya.officer@grievance.gov', 'officer')
    amit   = get_user('amit.officer@grievance.gov', 'officer')
    sunita = get_user('sunita.officer@grievance.gov', 'officer')
    rahul  = get_user('citizen@example.com', 'citizen')

    print("Seeding complaints and timelines...")
    # ── Seed demo complaints ─────────────────────────────────────
    demo = [
        ('GRV-2024-001', 'water_supply',     'Low Pressure',       'Low water pressure in Sector 15',
         'Very low water pressure in our area for 2 weeks. Barely enough for daily needs.',
         'Sector 15, Block B, Delhi', 'high', 'resolved',
         rajesh, 'Our team found a blocked main pipe. Cleaned it and pressure restored.', '2024-03-01 10:00:00'),

        ('GRV-2024-002', 'electricity',      'Power Cut',          'Frequent power cuts in evening',
         'Power cuts every evening 6–9 PM for the last 10 days. Affecting daily routine.',
         'Sector 12, Block C, Delhi', 'medium', 'pending',
         priya, None, '2024-03-05 14:00:00'),

        ('GRV-2024-003', 'road_maintenance', 'Pothole',            'Large pothole near main market',
         'Large pothole on main road near market causing accidents and traffic jams.',
         'Main Market Road, Sector 4, Delhi', 'high', 'resolved',
         amit, 'Road repair team filled the pothole with asphalt. Area restored.', '2024-02-20 09:00:00'),

        ('GRV-2024-004', 'sanitation',       'Garbage Collection', 'Irregular garbage collection',
         'Garbage collection irregular for a month. Piles up for days causing health issues.',
         'Block D, Sector 8, Delhi', 'medium', 'pending',
         sunita, None, '2024-03-10 11:00:00'),

        ('GRV-2024-005', 'street_lighting',  'Light Not Working',  'Street lights not working in park area',
         'All street lights in the public park have stopped working. Unsafe at night.',
         'Public Park, Sector 6, Delhi', 'medium', 'in_progress',
         amit, None, '2024-03-09 16:00:00'),

        ('GRV-2026-006', 'road_maintenance', 'Pothole',            'road has a big pot hole',
         'Huge pothole on the road leading to the colony. Two wheelers have already fallen.',
         'Colony Entry Road, Sector 21, Delhi', 'high', 'pending',
         amit, None, '2026-04-24 12:00:00'),
    ]

    for ticket, cat, subcat, title, desc, loc, pri, status, officer, resolution, created in demo:
        cid = str(uuid.uuid4())
        c.execute("""INSERT INTO complaints
            (id,ticket_id,citizen_id,citizen_name,citizen_email,citizen_phone,
             category,subcategory,title,description,location,priority,status,
             ai_summary,auto_reply,assigned_to,assigned_officer_name,resolution,
             created_at,updated_at,resolved_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
            cid, ticket,
            rahul['id'], rahul['name'], 'citizen@example.com', '9876543210',
            cat, subcat, title, desc, loc, pri, status,
            f"{title} – {cat.replace('_',' ')} issue reported at {loc}.",
            f"Dear Citizen,\n\nYour complaint has been registered. Ticket ID: {ticket}\n\nForwarded to relevant department.\n\nRegards,\nGrievance Portal",
            officer['id'] if officer else None,
            officer['name'] if officer else None,
            resolution,
            created, created,
            created if status == 'resolved' else None
        ))

        # Timeline entries
        c.execute('INSERT INTO timeline (id,complaint_id,title,description,status) VALUES (?,?,?,?,?)',
                  (str(uuid.uuid4()), cid, 'Complaint Submitted', 'Registered on portal.', 'pending'))
        if officer:
            c.execute('INSERT INTO timeline (id,complaint_id,title,description,status,actor_name) VALUES (?,?,?,?,?,?)',
                      (str(uuid.uuid4()), cid, 'Assigned to Officer',
                       f"Assigned to {officer['name']}.", 'assigned', officer['name']))
        if status == 'in_progress':
            c.execute('INSERT INTO timeline (id,complaint_id,title,description,status,actor_name) VALUES (?,?,?,?,?,?)',
                      (str(uuid.uuid4()), cid, 'Work In Progress',
                       'Officer has started working on this complaint.', 'in_progress', officer['name'] if officer else ''))
        if status == 'resolved':
            c.execute('INSERT INTO timeline (id,complaint_id,title,description,status,actor_name) VALUES (?,?,?,?,?,?)',
                      (str(uuid.uuid4()), cid, 'Complaint Resolved',
                       f"Resolved by {officer['name'] if officer else 'Officer'}. {resolution}", 'resolved',
                       officer['name'] if officer else ''))

    # Seed notifications for citizen
    c.execute("SELECT id, ticket_id, status FROM complaints WHERE citizen_id=? LIMIT 4", (rahul['id'],))
    for comp in c.fetchall():
        c.execute('INSERT INTO notifications (id,user_id,complaint_id,message) VALUES (?,?,?,?)',
                  (str(uuid.uuid4()), rahul['id'], comp['id'],
                   f"Your complaint {comp['ticket_id']} status updated to {comp['status']}."))

    conn.commit()
    conn.close()
    print(f"✅ Database initialized with new separated architecture: {DB_PATH}")

if __name__ == '__main__':
    init()