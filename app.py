"""
Smart Public Grievance Redressal Portal — Flask Backend
Roles: citizen, officer (one login -> multiple officers via tabs), admin
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, uuid, hashlib, os, base64, json
from datetime import datetime
import anthropic

app = Flask(__name__)

# Permissive CORS for local development to prevent network/preflight errors
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Database lives in the separate /database folder at project root
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH    = os.path.join(BASE_DIR, 'database', 'grievance.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'database', 'uploads')
print(f"[startup] DB path: {DB_PATH}")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ai_client = anthropic.Anthropic()   # reads ANTHROPIC_API_KEY from env

# ──────────────────────────────────────────────
# DB HELPERS
# ──────────────────────────────────────────────
def get_db():
    # Adding a 15-second timeout tells SQLite to wait gracefully if the DB is busy
    conn = sqlite3.connect(DB_PATH, timeout=15.0) 
    conn.row_factory = sqlite3.Row
    return conn
def hp(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def new_ticket():
    return f"GRV-{datetime.now().year}-{str(uuid.uuid4().int)[:3]:0>3}"

def init_db():
    """Ensure all tables exist for the new separated architecture."""
    conn = get_db(); c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("CREATE TABLE IF NOT EXISTS admin_profiles (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id))")
    c.execute("CREATE TABLE IF NOT EXISTS citizen_profiles (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, address TEXT, FOREIGN KEY(user_id) REFERENCES users(id))")
    c.execute("CREATE TABLE IF NOT EXISTS officer_profiles (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, department TEXT, assigned_categories TEXT, FOREIGN KEY(user_id) REFERENCES users(id))")

    c.execute("""CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY, ticket_id TEXT UNIQUE NOT NULL, citizen_id TEXT, citizen_name TEXT,
        citizen_email TEXT, citizen_phone TEXT, category TEXT NOT NULL, subcategory TEXT,
        title TEXT NOT NULL, description TEXT NOT NULL, location TEXT NOT NULL, priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending', image_filename TEXT, ai_summary TEXT, auto_reply TEXT,
        assigned_to TEXT, assigned_officer_name TEXT, resolution TEXT, resolved_image_filename TEXT, ai_report TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS timeline (
        id TEXT PRIMARY KEY, complaint_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
        status TEXT, actor_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, complaint_id TEXT, message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    conn.commit(); conn.close()
    print("DB architecture verified.")

def push_notification(conn, user_id, complaint_id, msg):
    conn.cursor().execute(
        'INSERT INTO notifications (id,user_id,complaint_id,message) VALUES (?,?,?,?)',
        (str(uuid.uuid4()), user_id, complaint_id, msg)
    )

# ──────────────────────────────────────────────
# AI
# ──────────────────────────────────────────────
CAT_LABELS = {
    'water_supply': 'Water Supply', 'electricity': 'Electricity',
    'road_maintenance': 'Road Maintenance', 'sanitation': 'Sanitation',
    'street_lighting': 'Street Lighting', 'other': 'Other'
}

def ai_summary(title, desc, cat, loc):
    try:
        r = ai_client.messages.create(
            model="claude-opus-4-5", max_tokens=200,
            messages=[{"role": "user", "content":
                f"Summarize this public grievance in 2 concise sentences.\nCategory: {cat}\nTitle: {title}\nLocation: {loc}\nDescription: {desc}"}])
        return r.content[0].text.strip()
    except:
        return f"{title} – {CAT_LABELS.get(cat, cat)} issue at {loc}."

def ai_auto_reply(cat, priority, ticket_id):
    dept_map = {'water_supply': 'Water Supply Department', 'electricity': 'Electricity Board',
                'road_maintenance': 'Public Works Department', 'sanitation': 'Municipal Corporation',
                'street_lighting': 'Street Lighting Division', 'other': 'Appropriate Department'}
    tl_map = {'critical': '1-2 days', 'high': '2-3 days', 'medium': '3-5 days', 'low': '5-7 days'}
    dept = dept_map.get(cat, 'Appropriate Department')
    tl   = tl_map.get(priority, '3-5 days')
    return (f"Dear Citizen,\n\nYour complaint has been registered successfully.\n"
            f"Ticket ID: {ticket_id}\n\nIt has been forwarded to the {dept}. "
            f"Expected resolution time: {tl}.\n\nTrack your complaint anytime using the Ticket ID.\n\n"
            f"Regards,\nSmart Grievance Portal")

def ai_resolution_report(complaint, img_b64=None):
    try:
        content = []
        if img_b64:
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64}})
        content.append({"type": "text", "text": f"""Generate an official Grievance Resolution Report as a formal government document.

TICKET ID: {complaint['ticket_id']}
CATEGORY: {CAT_LABELS.get(complaint['category'], complaint['category'])}
TITLE: {complaint['title']}
DESCRIPTION: {complaint['description']}
LOCATION: {complaint['location']}
PRIORITY: {complaint['priority']}
CITIZEN NAME: {complaint.get('citizen_name', 'Anonymous')}
ASSIGNED OFFICER: {complaint.get('assigned_officer_name', 'Department Team')}
RESOLUTION NOTES: {complaint.get('resolution', 'Issue resolved.')}
DATE FILED: {complaint['created_at']}
DATE RESOLVED: {datetime.now().strftime('%Y-%m-%d %H:%M')}
IMAGE: {'Citizen uploaded photo evidence (shown above — analyze it).' if img_b64 else 'No image was uploaded by the citizen.'}

Write a formal report with these sections:
1. REPORT HEADER
2. COMPLAINT SUMMARY
3. IMAGE ANALYSIS
4. ACTIONS TAKEN
5. RESOLUTION OUTCOME
6. RECOMMENDATIONS
7. OFFICIAL SIGN-OFF

Use plain text with section headers underlined with ===."""})
        r = ai_client.messages.create(model="claude-opus-4-5", max_tokens=1200,
                                       messages=[{"role": "user", "content": content}])
        return r.content[0].text.strip()
    except Exception as e:
        return (f"GRIEVANCE RESOLUTION REPORT\n{'='*40}\n"
                f"Ticket: {complaint['ticket_id']}\nStatus: RESOLVED\n"
                f"Officer: {complaint.get('assigned_officer_name', '')}\n"
                f"Resolution: {complaint.get('resolution', '')}\n"
                f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

# ──────────────────────────────────────────────
# AUTH ROUTES 
# ──────────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({'ok': True})

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    conn = get_db(); c = conn.cursor()
    
    c.execute('SELECT id, email, role FROM users WHERE email=? AND password_hash=?',
              (d.get('email', ''), hp(d.get('password', ''))))
    auth_user = c.fetchone()
    
    if not auth_user:
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    uid = auth_user['id']
    role = auth_user['role']
    
    user_data = {'id': uid, 'email': auth_user['email'], 'role': role}
    
    if role == 'citizen':
        c.execute('SELECT name, phone, address FROM citizen_profiles WHERE user_id=?', (uid,))
        profile = c.fetchone()
        if profile:
            user_data.update({'name': profile['name'], 'phone': profile['phone'], 'address': profile['address']})
            
    elif role == 'officer':
        c.execute('SELECT name, phone, department, assigned_categories FROM officer_profiles WHERE user_id=?', (uid,))
        profile = c.fetchone()
        if profile:
            cats = json.loads(profile['assigned_categories']) if profile['assigned_categories'] else []
            user_data.update({'name': profile['name'], 'phone': profile['phone'], 'department': profile['department'], 'assignedCategories': cats})
            
    elif role == 'admin':
        c.execute('SELECT name FROM admin_profiles WHERE user_id=?', (uid,))
        profile = c.fetchone()
        if profile:
            user_data.update({'name': profile['name']})

    conn.close()
    return jsonify({'success': True, 'user': user_data})

@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.json or {}
    if not all(k in d for k in ['name', 'email', 'password']):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
    conn = get_db(); c = conn.cursor()
    c.execute('SELECT id FROM users WHERE email=?', (d['email'],))
    if c.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
    uid = str(uuid.uuid4())
    
    # 1. Insert Auth Credentials into 'users' table
    c.execute('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)',
              (uid, d['email'], hp(d['password']), 'citizen'))
              
    # 2. Insert Citizen Details into 'citizen_profiles' table
    c.execute('INSERT INTO citizen_profiles (user_id, name, phone, address) VALUES (?,?,?,?)',
              (uid, d['name'], d.get('phone', ''), d.get('address', '')))
              
    conn.commit(); conn.close()
    return jsonify({'success': True, 'user': {'id': uid, 'name': d['name'], 'email': d['email'], 'role': 'citizen'}}), 201

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    d = request.json or {}
    email, new_password, role = d.get('email'), d.get('password'), d.get('role')

    if not email or not new_password or not role:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    conn = get_db(); c = conn.cursor()
    c.execute('SELECT id FROM users WHERE email=? AND role=?', (email, role))
    if not c.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': 'Account not found with this email and role'}), 404
        
    c.execute('UPDATE users SET password_hash=? WHERE email=? AND role=?', (hp(new_password), email, role))
    conn.commit(); conn.close()
    
    return jsonify({'success': True, 'message': 'Password updated successfully'})


# ──────────────────────────────────────────────
# OFFICERS
# ──────────────────────────────────────────────
@app.route('/api/officers', methods=['GET'])
def get_officers():
    conn = get_db(); c = conn.cursor()
    c.execute("""
        SELECT u.id, u.email, o.name, o.department, o.phone, o.assigned_categories 
        FROM users u 
        JOIN officer_profiles o ON u.id = o.user_id 
        WHERE u.role='officer' 
        ORDER BY o.name
    """)
    rows = c.fetchall()
    result = []
    for r in rows:
        cats = json.loads(r['assigned_categories']) if r['assigned_categories'] else []
        c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to=?", (r['id'],))
        assigned = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to=? AND status='resolved'", (r['id'],))
        resolved = c.fetchone()['n']
        result.append({'id': r['id'], 'name': r['name'], 'email': r['email'],
                       'department': r['department'], 'phone': r['phone'],
                       'assignedCategories': cats, 'assignedCount': assigned, 'resolvedCount': resolved})
    conn.close()
    return jsonify({'success': True, 'officers': result})

@app.route('/api/officers', methods=['POST'])
def add_officer():
    d = request.json or {}
    if not all(k in d for k in ['name', 'email', 'department', 'categories']):
        return jsonify({'success': False, 'error': 'Missing fields'}), 400
        
    conn = get_db(); c = conn.cursor()
    c.execute('SELECT id FROM users WHERE email=?', (d['email'],))
    if c.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': 'Email already exists'}), 400
        
    uid = str(uuid.uuid4())
    c.execute('INSERT INTO users (id, email, password_hash, role) VALUES (?,?,?,?)',
              (uid, d['email'], hp(d.get('password', 'officer123')), 'officer'))
    c.execute('INSERT INTO officer_profiles (user_id, name, phone, department, assigned_categories) VALUES (?,?,?,?,?)',
              (uid, d['name'], d.get('phone', ''), d['department'], json.dumps(d['categories'])))
              
    conn.commit(); conn.close()
    return jsonify({'success': True}), 201

# ──────────────────────────────────────────────
# CITIZENS (ADMIN VIEW)
# ──────────────────────────────────────────────
@app.route('/api/citizens', methods=['GET'])
def get_citizens():
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Using LEFT JOIN guarantees we see the citizen even if their profile data is missing!
        c.execute("""
            SELECT u.id, u.email, cp.name, cp.phone, cp.address, u.created_at
            FROM users u 
            LEFT JOIN citizen_profiles cp ON u.id = cp.user_id 
            WHERE u.role='citizen' 
            ORDER BY u.created_at DESC
        """)
        citizens = [dict(r) for r in c.fetchall()]
        
        # Get the total number of complaints each citizen has made
        for citizen in citizens:
            c.execute("SELECT COUNT(*) n FROM complaints WHERE citizen_id=?", (citizen['id'],))
            citizen['complaintCount'] = c.fetchone()['n']
            
            # Clean up missing names from any database crashes
            if not citizen['name']:
                citizen['name'] = "Unnamed Citizen"
            
        conn.close()
        return jsonify({'success': True, 'citizens': citizens})
    except Exception as e:
        print(f"Error fetching citizens: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ──────────────────────────────────────────────
# COMPLAINTS
# ──────────────────────────────────────────────
def _fmt(r):
    return {
        'id': r['id'], 'ticketId': r['ticket_id'],
        'citizenId': r['citizen_id'], 'citizenName': r['citizen_name'],
        'citizenEmail': r['citizen_email'], 'citizenPhone': r['citizen_phone'],
        'category': r['category'], 'categoryLabel': CAT_LABELS.get(r['category'], r['category'].replace('_',' ').title()),
        'subcategory': r['subcategory'], 'title': r['title'],
        'description': r['description'], 'location': r['location'],
        'priority': r['priority'], 'status': r['status'],
        'aiSummary': r['ai_summary'], 'autoReply': r['auto_reply'],
        'assignedTo': r['assigned_to'], 'assignedOfficer': r['assigned_officer_name'],
        'resolution': r['resolution'], 'aiReport': r['ai_report'],
        'hasImage': bool(r['image_filename']),
        'imageUrl': f"/api/uploads/{r['image_filename']}" if r['image_filename'] else None,
        'hasResolvedImage': bool(r['resolved_image_filename']) if 'resolved_image_filename' in r.keys() else False,
        'resolvedImageUrl': f"/api/uploads/{r['resolved_image_filename']}" if ('resolved_image_filename' in r.keys() and r['resolved_image_filename']) else None,
        'createdAt': r['created_at'], 'updatedAt': r['updated_at'], 'resolvedAt': r['resolved_at']
    }

@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    img_filename = None
    if request.content_type and 'multipart' in request.content_type:
        data = request.form.to_dict()
        f = request.files.get('image')
        if f and f.filename:
            ext = f.filename.rsplit('.', 1)[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                img_filename = f"{uuid.uuid4()}.{ext}"
                f.save(os.path.join(UPLOAD_DIR, img_filename))
    else:
        data = request.json or {}

    for k in ['category', 'title', 'description', 'location']:
        if not data.get(k):
            return jsonify({'success': False, 'error': f'{k} is required'}), 400

    cid    = str(uuid.uuid4())
    ticket = new_ticket()
    summary = ai_summary(data['title'], data['description'], data['category'], data['location'])
    reply   = ai_auto_reply(data['category'], data.get('priority', 'medium'), ticket)

    conn = get_db(); c = conn.cursor()

    # auto-assign by category
    assigned_to = None; assigned_name = None
    
    c.execute("""
        SELECT u.id, o.name, o.assigned_categories 
        FROM users u 
        JOIN officer_profiles o ON u.id = o.user_id 
        WHERE u.role='officer' 
        ORDER BY u.created_at DESC
    """)
    for o in c.fetchall():
        cats = json.loads(o['assigned_categories']) if o['assigned_categories'] else []
        if data['category'] in cats:
            assigned_to = o['id']; assigned_name = o['name']; break

    initial_status = 'assigned' if assigned_to else 'pending'

    c.execute("""INSERT INTO complaints
        (id,ticket_id,citizen_id,citizen_name,citizen_email,citizen_phone,
         category,subcategory,title,description,location,priority,status,
         image_filename,ai_summary,auto_reply,assigned_to,assigned_officer_name)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
        cid, ticket, data.get('citizen_id'), data.get('citizen_name'),
        data.get('citizen_email'), data.get('citizen_phone'),
        data['category'], data.get('subcategory', ''),
        data['title'], data['description'], data['location'],
        data.get('priority', 'medium'), initial_status,
        img_filename, summary, reply, assigned_to, assigned_name
    ))

    tl_title = 'Assigned to Officer' if assigned_to else 'Complaint Submitted'
    tl_desc  = f'Auto-assigned to {assigned_name}.' if assigned_to else 'Registered. AI summary generated.'
    c.execute('INSERT INTO timeline (id,complaint_id,title,description,status) VALUES (?,?,?,?,?)',
              (str(uuid.uuid4()), cid, tl_title, tl_desc, initial_status))

    if data.get('citizen_id'):
        push_notification(conn, data['citizen_id'], cid, f"Complaint {ticket} submitted. {tl_title}.")

    conn.commit(); conn.close()
    return jsonify({'success': True, 'ticketId': ticket, 'aiSummary': summary,
                    'autoReply': reply, 'hasImage': img_filename is not None,
                    'assignedOfficer': assigned_name}), 201

@app.route('/api/complaints', methods=['GET'])
def list_complaints():
    citizen_id, officer_id = request.args.get('citizen_id', ''), request.args.get('officer_id', '')
    status_f, cat_f = request.args.get('status', ''), request.args.get('category', '')

    conn = get_db(); c = conn.cursor()
    where, params = [], []
    if citizen_id: where.append('citizen_id=?'); params.append(citizen_id)
    if officer_id: where.append('assigned_to=?'); params.append(officer_id)
    if status_f and status_f != 'all': where.append('status=?'); params.append(status_f)
    if cat_f and cat_f != 'all':       where.append('category=?'); params.append(cat_f)

    sql = 'SELECT * FROM complaints'
    if where: sql += ' WHERE ' + ' AND '.join(where)
    sql += ' ORDER BY created_at DESC'
    c.execute(sql, params)
    rows = [_fmt(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'success': True, 'complaints': rows})

@app.route('/api/complaints/<ticket_id>', methods=['GET'])
def get_complaint(ticket_id):
    conn = get_db(); c = conn.cursor()
    c.execute('SELECT * FROM complaints WHERE ticket_id=?', (ticket_id,))
    r = c.fetchone()
    if not r:
        conn.close(); return jsonify({'success': False, 'error': 'Not found'}), 404
    c.execute('SELECT * FROM timeline WHERE complaint_id=? ORDER BY created_at ASC', (r['id'],))
    tl = [dict(t) for t in c.fetchall()]
    conn.close()
    data = _fmt(r); data['timeline'] = tl
    return jsonify({'success': True, 'complaint': data})

@app.route('/api/complaints/<ticket_id>', methods=['PUT'])
def update_complaint(ticket_id):
    d = request.json or {}
    conn = get_db(); c = conn.cursor()
    c.execute('SELECT * FROM complaints WHERE ticket_id=?', (ticket_id,))
    r = c.fetchone()
    if not r:
        conn.close(); return jsonify({'success': False, 'error': 'Not found'}), 404

    if 'assignedTo' in d:
        c.execute('SELECT user_id as id, name FROM officer_profiles WHERE user_id=?', (d['assignedTo'],))
        o = c.fetchone()
        oname = o['name'] if o else ''
        c.execute("""UPDATE complaints SET assigned_to=?,assigned_officer_name=?,
                     status='assigned',updated_at=CURRENT_TIMESTAMP WHERE ticket_id=?""",
                  (d['assignedTo'], oname, ticket_id))
        c.execute('INSERT INTO timeline (id,complaint_id,title,description,status,actor_name) VALUES (?,?,?,?,?,?)',
                  (str(uuid.uuid4()), r['id'], 'Assigned to Officer', f'Assigned to {oname}.', 'assigned', oname))
        if r['citizen_id']:
            push_notification(conn, r['citizen_id'], r['id'], f"Complaint {ticket_id} assigned to {oname}.")
        conn.commit(); conn.close()
        return jsonify({'success': True})

    if 'status' in d:
        ns = d['status']
        c.execute('UPDATE complaints SET status=?,updated_at=CURRENT_TIMESTAMP WHERE ticket_id=?', (ns, ticket_id))
        label_map = {'in_progress': 'Work In Progress', 'pending': 'Under Review', 'assigned': 'Assigned'}
        c.execute('INSERT INTO timeline (id,complaint_id,title,description,status,actor_name) VALUES (?,?,?,?,?,?)',
                  (str(uuid.uuid4()), r['id'], label_map.get(ns, ns.title()), f'Status updated to {ns}.', ns, d.get('actorName', '')))
        if r['citizen_id']:
            push_notification(conn, r['citizen_id'], r['id'], f"Your complaint {ticket_id} status changed to {ns}.")
        conn.commit(); conn.close()
        return jsonify({'success': True})

    conn.close()
    return jsonify({'success': False, 'error': 'Nothing to update'}), 400

@app.route('/api/complaints/<ticket_id>/resolve', methods=['PUT'])
def resolve_complaint(ticket_id):

    resolution = request.form.get(
        'resolution',
        'Issue has been resolved.'
    )

    officer_name = request.form.get(
        'officerName',
        'Officer'
    )

    resolved_file = request.files.get(
        'resolved_image'
    )

    conn = get_db()
    c = conn.cursor()

    c.execute(
        'SELECT * FROM complaints WHERE ticket_id=?',
        (ticket_id,)
    )

    r = c.fetchone()

    if not r:
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Not found'
        }), 404

    resolved_filename = None

    if resolved_file and resolved_file.filename:

        ext = resolved_file.filename.rsplit(
            '.',
            1
        )[-1].lower()

        resolved_filename = (
            f"resolved_{uuid.uuid4()}.{ext}"
        )

        resolved_file.save(
            os.path.join(
                UPLOAD_DIR,
                resolved_filename
            )
        )

    complaint_dict = dict(r)

    complaint_dict[
        'assigned_officer_name'
    ] = officer_name

    complaint_dict[
        'resolution'
    ] = resolution

    img_b64 = None

    if r['image_filename']:

        path = os.path.join(
            UPLOAD_DIR,
            r['image_filename']
        )

        if os.path.exists(path):

            with open(path, 'rb') as f:

                img_b64 = base64.b64encode(
                    f.read()
                ).decode()

    report = ai_resolution_report(
        complaint_dict,
        img_b64
    )

    c.execute("""
    UPDATE complaints
    SET
        status='resolved',
        resolution=?,
        resolved_image_filename=?,
        ai_report=?,
        assigned_officer_name=?,
        updated_at=CURRENT_TIMESTAMP,
        resolved_at=CURRENT_TIMESTAMP
    WHERE ticket_id=?
    """,
    (
        resolution,
        resolved_filename,
        report,
        officer_name,
        ticket_id
    ))

    c.execute(
        '''
        INSERT INTO timeline
        (
            id,
            complaint_id,
            title,
            description,
            status,
            actor_name
        )
        VALUES
        (
            ?,?,?,?,?,?
        )
        ''',
        (
            str(uuid.uuid4()),
            r['id'],
            'Complaint Resolved',
            f'Resolved by {officer_name}. {resolution}',
            'resolved',
            officer_name
        )
    )

    if r['citizen_id']:

        push_notification(
            conn,
            r['citizen_id'],
            r['id'],
            f"Your complaint {ticket_id} has been resolved!"
        )

    conn.commit()
    conn.close()

    return jsonify({
    'success': True,
    'aiReport': report,
    'resolvedImageUrl':
        f"/api/uploads/{resolved_filename}"
        if resolved_filename
        else None
})
# ──────────────────────────────────────────────
# NOTIFICATIONS
# ──────────────────────────────────────────────
@app.route('/api/notifications/<user_id>', methods=['GET'])
def get_notifications(user_id):
    conn = get_db(); c = conn.cursor()
    c.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20', (user_id,))
    rows = [dict(r) for r in c.fetchall()]
    c.execute('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0', (user_id,))
    unread = c.fetchone()['n']
    conn.close()
    return jsonify({'success': True, 'notifications': rows, 'unread': unread})

@app.route('/api/notifications/<user_id>/read', methods=['PUT'])
def mark_read(user_id):
    conn = get_db(); c = conn.cursor()
    c.execute('UPDATE notifications SET is_read=1 WHERE user_id=?', (user_id,))
    conn.commit(); conn.close()
    return jsonify({'success': True})

# ──────────────────────────────────────────────
# DASHBOARD STATS
# ──────────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    role      = request.args.get('role', '')
    user_id   = request.args.get('userId', request.args.get('citizenId', ''))
    officer_id= request.args.get('officerId', '')

    conn = get_db(); c = conn.cursor()

    if role == 'citizen' and user_id:
        c.execute('SELECT COUNT(*) n FROM complaints WHERE citizen_id=?', (user_id,)); total = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE citizen_id=? AND status NOT IN ('resolved')", (user_id,)); pending = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE citizen_id=? AND status='in_progress'", (user_id,)); inprog = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE citizen_id=? AND status='resolved'", (user_id,)); resolved = c.fetchone()['n']
        c.execute('SELECT * FROM complaints WHERE citizen_id=? ORDER BY created_at DESC LIMIT 5', (user_id,))
        recent = [_fmt(r) for r in c.fetchall()]
        conn.close()
        return jsonify({'total': total, 'pending': pending, 'inProgress': inprog,
                        'resolved': resolved, 'recentComplaints': recent})

    if role == 'officer' and officer_id:
        c.execute('SELECT COUNT(*) n FROM complaints WHERE assigned_to=?', (officer_id,)); total = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to=? AND status IN ('pending','assigned')", (officer_id,)); pending = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to=? AND status='in_progress'", (officer_id,)); inprog = c.fetchone()['n']
        c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to=? AND status='resolved'", (officer_id,)); resolved = c.fetchone()['n']
        c.execute("SELECT * FROM complaints WHERE assigned_to=? AND status IN ('pending','assigned') ORDER BY created_at DESC LIMIT 5", (officer_id,))
        pending_list = [_fmt(r) for r in c.fetchall()]
        c.execute("SELECT * FROM complaints WHERE assigned_to=? AND status='in_progress' ORDER BY created_at DESC", (officer_id,))
        inprog_list = [_fmt(r) for r in c.fetchall()]
        conn.close()
        return jsonify({'total': total, 'pendingAction': pending, 'inProgress': inprog,
                        'resolved': resolved, 'pendingComplaints': pending_list,
                        'inProgressComplaints': inprog_list})

    # admin
    c.execute('SELECT COUNT(*) n FROM complaints'); total = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM complaints WHERE status IN ('pending','assigned')"); pending = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM complaints WHERE status='in_progress'"); inprog = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM complaints WHERE status='resolved'"); resolved = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM complaints WHERE priority='high'"); high = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM complaints WHERE assigned_to IS NULL"); unassigned = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM users WHERE role='citizen'"); citizens = c.fetchone()['n']
    c.execute("SELECT COUNT(*) n FROM users WHERE role='officer'"); officers = c.fetchone()['n']
    c.execute("SELECT category, COUNT(*) cnt FROM complaints GROUP BY category")
    cat_dist = {r['category']: r['cnt'] for r in c.fetchall()}
    c.execute("SELECT * FROM complaints WHERE assigned_to IS NULL ORDER BY created_at DESC LIMIT 10")
    unassigned_list = [_fmt(r) for r in c.fetchall()]
    conn.close()
    rate = round(resolved / total * 100) if total else 0
    return jsonify({'total': total, 'pending': pending, 'inProgress': inprog,
                    'resolved': resolved, 'highPriority': high, 'unassigned': unassigned,
                    'totalCitizens': citizens, 'totalOfficers': officers,
                    'resolutionRate': rate, 'categoryDistribution': cat_dist,
                    'unassignedComplaints': unassigned_list})

@app.route('/api/uploads/<filename>')
def serve_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)