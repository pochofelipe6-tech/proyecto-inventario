import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, ArrowUpRight, Box, Check, ChevronLeft, ChevronRight, CircleHelp, Cpu, Download, LayoutGrid, LogOut, Monitor, MoreHorizontal, Pencil, Plus, Search, ShieldCheck, Trash2, Users, Wrench, X } from 'lucide-react';
import { api, supabase } from './lib';
import { demoProducts, demoUsers } from './demo';
import { productSchema, type Product, type ProductInput, type Profile } from '../shared/schema';

const blank: ProductInput = { asset_tag: '', brand: '', model: '', serial_number: '', type: 'Portátil', status: 'Disponible', location: '', assigned_to: null, processor: '', ram_gb: 16, storage_gb: 512, notes: '' };
const statuses = ['Disponible', 'Asignado', 'Mantenimiento', 'De baja'] as const;
const statusClass = (s: string) => ({ Disponible: 'green', Asignado: 'blue', Mantenimiento: 'amber', 'De baja': 'gray' }[s]);
const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Ocurrió un error. Intenta nuevamente.';
const date = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setReady(true); } }).catch(() => { if (active) setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => { setSession(value); setReady(true); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  if (!ready) return <div className="boot">Cargando tu espacio de trabajo…</div>;
  if (!session && !demo) return <Auth onDemo={() => setDemo(true)} />;
  return <Dashboard key={demo ? 'demo' : session!.user.id} demo={demo} session={session} onExit={async () => { if (demo) setDemo(false); else { const result = await supabase!.auth.signOut(); if (result.error) throw result.error; } }} />;
}

function Auth({ onDemo }: { onDemo: () => void }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError('');
    if (!supabase) { setError('Conecta tu proyecto de Supabase siguiendo el archivo README.md. También puedes explorar la demostración.'); return; }
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const credentials = { email: String(data.get('email')).trim(), password: String(data.get('password')) };
      if (register) {
        const fullName = String(data.get('name')).trim();
        if (!fullName) throw new Error('Escribe tu nombre completo.');
        const { data: result, error: authError } = await supabase.auth.signUp({ ...credentials, options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin } });
        if (authError) throw authError;
        if (!result.session) setMessage('Revisa tu correo para confirmar tu cuenta. Si ya estabas registrado, puedes iniciar sesión.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword(credentials);
        if (authError) throw authError;
      }
    } catch (e) { const msg = errorText(e); setError(msg === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : msg === 'Email not confirmed' ? 'Confirma tu correo antes de iniciar sesión.' : msg); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story"><Logo /><div><span className="eyebrow">MENOS DESORDEN. MÁS CONTROL.</span><h1>Cada equipo,<br />en su lugar.</h1><p>Un espacio para organizar los computadores de tu empresa y mantener a tu equipo conectado.</p><div className="auth-illustration"><div className="illustration-icon"><Monitor size={70} strokeWidth={1.2}/></div><span className="floating-label"><Check size={15}/> Inventario al día</span><div className="illustration-line"/><div className="illustration-line short"/></div></div><small>Tu inventario. Tu equipo. Todo conectado.</small></section>
    <section className="auth-panel"><div className="auth-form"><span className="mini-label">BIENVENIDO A NEXO</span><h2>{register ? 'Crea tu cuenta' : 'Qué bueno verte de nuevo'}</h2><p>{register ? 'Regístrate para acceder al inventario de la empresa.' : 'Ingresa a tu espacio de trabajo para continuar.'}</p><div className="auth-tabs"><button className={!register ? 'active' : ''} onClick={() => { setRegister(false); setError(''); setMessage(''); }}>Iniciar sesión</button><button className={register ? 'active' : ''} onClick={() => { setRegister(true); setError(''); setMessage(''); }}>Registrarme</button></div>
    <form onSubmit={submit}>{register && <label>Nombre completo<input name="name" autoComplete="name" placeholder="Tu nombre y apellido" maxLength={120} required /></label>}<label>Correo electrónico<input name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" required /></label><label>Contraseña<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Mínimo 8 caracteres' : 'Tu contraseña'} minLength={register ? 8 : 1} maxLength={128} required /></label>{error && <div className="alert error" role="alert">{error}</div>}{message && <div className="alert success" role="status">{message}</div>}<button className="primary full" disabled={busy}>{busy ? 'Un momento…' : register ? 'Crear cuenta' : 'Ingresar'}<ArrowRight size={17}/></button></form>
    <div className="auth-divider"><span>o conoce tu próximo espacio de trabajo</span></div><button className="secondary full" onClick={onDemo}>Explorar demostración <ArrowUpRight size={16}/></button><p className="auth-foot"><ShieldCheck size={15}/> Acceso protegido con Supabase Auth</p>{!supabase && <p className="config-note">Conexión pendiente. Configura las variables de Supabase en <code>.env</code> para activar el registro.</p>}</div></section>
  </main>;
}

function Logo() { return <div className="logo"><span><Box size={24} strokeWidth={1.7}/></span>nexo<span className="logo-dot">.</span></div>; }

function Dashboard({ demo, session, onExit }: { demo: boolean; session: Session | null; onExit: () => Promise<void> }) {
  const [tab, setTab] = useState<'products' | 'users'>('users');
  const [products, setProducts] = useState<Product[]>(demo ? demoProducts : []);
  const [users, setUsers] = useState<Profile[]>(demo ? demoUsers : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos los estados');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const name = demo ? 'Laura Martínez' : session?.user.user_metadata.full_name || session?.user.email || 'Mi cuenta';
  async function load() {
    setLoading(true); setError('');
    try { const [p, u] = await Promise.all([api<Product[]>('/products'), api<Profile[]>('/users')]); setProducts(p); setUsers(u); }
    catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }
  useEffect(() => { if (!demo) void load(); }, [demo]);
  useEffect(() => { setPage(1); }, [search, filter, tab]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(id); }, [notice]);
  const needle = search.toLocaleLowerCase();
  const filteredProducts = products.filter(p => (filter === 'Todos los estados' || p.status === filter) && [p.asset_tag, p.brand, p.model, p.serial_number, p.location, users.find(u => u.id === p.assigned_to)?.full_name || ''].join(' ').toLocaleLowerCase().includes(needle));
  const filteredUsers = users.filter(u => `${u.full_name} ${u.email}`.toLocaleLowerCase().includes(needle));
  const count = tab === 'products' ? filteredProducts.length : filteredUsers.length;
  const pages = Math.max(1, Math.ceil(count / 8));
  const activePage = Math.min(page, pages);
  const offset = (activePage - 1) * 8;
  async function save(input: ProductInput) {
    if (demo) {
      if (products.some(p => p.id !== (editing === 'new' ? undefined : editing?.id) && (p.asset_tag.toLowerCase() === input.asset_tag.toLowerCase() || p.serial_number.toLowerCase() === input.serial_number.toLowerCase()))) throw new Error('Ya existe un equipo con ese código o número de serie.');
      const now = new Date().toISOString();
      if (editing === 'new') setProducts(p => [{ ...input, id: crypto.randomUUID(), created_at: now, updated_at: now }, ...p]);
      else setProducts(p => p.map(item => item.id === editing?.id ? { ...item, ...input, updated_at: now } : item));
    } else {
      const saved = await api<Product>(editing === 'new' ? '/products' : `/products/${editing!.id}`, { method: editing === 'new' ? 'POST' : 'PUT', body: JSON.stringify(input) });
      setProducts(p => editing === 'new' ? [saved, ...p] : p.map(item => item.id === saved.id ? saved : item));
    }
    setNotice(editing === 'new' ? 'Computador registrado correctamente.' : 'Cambios guardados.'); setEditing(null);
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true); setError('');
    try { if (!demo) await api(`/products/${deleting.id}`, { method: 'DELETE' }); setProducts(p => p.filter(item => item.id !== deleting.id)); setDeleting(null); setNotice('Computador eliminado.'); }
    catch (e) { setError(errorText(e)); setDeleting(null); } finally { setBusy(false); }
  }
  function exportCsv() {
    const rows = tab === 'products' ? [['Código', 'Marca', 'Modelo', 'Serie', 'Tipo', 'Estado', 'Ubicación', 'Responsable', 'Procesador', 'RAM GB', 'Almacenamiento GB'], ...filteredProducts.map(p => [p.asset_tag, p.brand, p.model, p.serial_number, p.type, p.status, p.location, users.find(u => u.id === p.assigned_to)?.full_name || '', p.processor, p.ram_gb, p.storage_gb])] : [['Nombre', 'Correo', 'Registro'], ...filteredUsers.map(u => [u.full_name, u.email, u.created_at])];
    const csv = rows.map(row => row.map(cell => { let value = String(cell); if (/^[=+@\-\t\r]/.test(value)) value = `'${value}`; return `"${value.replaceAll('"', '""')}"`; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = `nexo-${tab === 'products' ? 'equipos' : 'usuarios'}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  const changeTab = (value: 'products' | 'users') => { setTab(value); setSearch(''); setFilter('Todos los estados'); };
  return <div className="app-shell"><aside className="sidebar"><Logo/><div className="workspace"><span className="workspace-icon">E</span><div><strong>Mi empresa</strong><small>Espacio de trabajo</small></div><MoreHorizontal size={18}/></div><span className="nav-heading">GESTIÓN</span><nav><button className={tab === 'products' ? 'selected' : ''} onClick={() => changeTab('products')}><Monitor size={19}/>Inventario<span>{products.length}</span></button><button className={tab === 'users' ? 'selected' : ''} onClick={() => changeTab('users')}><Users size={19}/>Usuarios<span>{users.length}</span></button></nav><div className="sidebar-bottom"><div className="tip-card"><div className="tip-icon"><LayoutGrid size={20}/></div><strong>Todo bajo control</strong><p>Un inventario organizado empieza con información al día.</p><button onClick={() => { changeTab('products'); setEditing('new'); }}>Registrar un equipo <ArrowRight size={15}/></button></div><button className="help-link" onClick={() => setHelp(true)}><CircleHelp size={18}/>Ayuda y primeros pasos</button><div className="profile"><span className="avatar">{initials(name)}</span><div><strong>{name}</strong><small>{demo ? 'Modo demostración' : 'Miembro del equipo'}</small></div><button title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => void onExit().catch(e => setError(errorText(e)))}><LogOut size={17}/></button></div></div></aside>
  <div className="main-area"><header className="topbar"><div><span>Mi empresa</span><ChevronRight size={13}/><strong>{tab === 'products' ? 'Inventario' : 'Usuarios'}</strong></div><span className="workspace-status"><i/>{demo ? 'Vista de demostración' : 'Espacio de trabajo'}</span></header>
  <main className="dashboard">{demo && <div className="demo-banner"><span><strong>Estás explorando una demostración.</strong> Los cambios se guardan solo durante esta sesión.</span><button onClick={() => void onExit()}>Salir <ArrowRight size={14}/></button></div>}
  <div className="page-heading"><div><span className="mini-label">TU ESPACIO, ORGANIZADO</span><h1>{tab === 'products' ? 'Inventario de equipos' : 'Nuestro equipo'}</h1><p>{tab === 'products' ? 'Administra los computadores de tu empresa en un solo lugar.' : 'Conoce a las personas que forman parte de tu espacio de trabajo.'}</p></div><button className="primary" onClick={() => { changeTab('products'); setEditing('new'); }}><Plus size={18}/>Nuevo computador</button></div>
  <section className="stats" aria-label="Resumen del inventario">{[
    { title: 'Total de equipos', value: products.length, icon: Monitor, tone: 'neutral', foot: 'Computadores registrados' },
    { title: 'Disponibles', value: products.filter(p => p.status === 'Disponible').length, icon: Check, tone: 'green', foot: 'Listos para ser asignados' },
    { title: 'Asignados', value: products.filter(p => p.status === 'Asignado').length, icon: Users, tone: 'blue', foot: 'En manos de tu equipo' },
    { title: 'En mantenimiento', value: products.filter(p => p.status === 'Mantenimiento').length, icon: Wrench, tone: 'amber', foot: 'En revisión técnica' }
  ].map(s => <article className="stat-card" key={s.title}><div><span>{s.title}</span><span className={`stat-icon ${s.tone}`}><s.icon size={19}/></span></div><strong>{loading ? '—' : s.value.toString().padStart(2, '0')}</strong><small>{s.foot}</small></article>)}</section>
  {error && <div className="alert error" role="alert">{error} {!demo && <button onClick={() => void load()}>Reintentar</button>}</div>}{notice && <div className="toast" role="status"><Check size={17}/>{notice}</div>}
  <section className="table-card"><div className="table-title"><div><h2>{tab === 'products' ? 'Todos los computadores' : 'Usuarios registrados'} <span>{tab === 'products' ? products.length : users.length}</span></h2><p>{tab === 'products' ? 'Consulta, actualiza y organiza tus activos tecnológicos.' : 'Las nuevas cuentas aparecen aquí automáticamente.'}</p></div><button className="secondary" disabled={loading || count === 0} onClick={exportCsv}><Download size={16}/>Exportar</button></div><div className="table-toolbar"><div className="search-input"><Search size={18}/><input aria-label="Buscar" value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'products' ? 'Buscar por equipo, código o número de serie…' : 'Buscar por nombre o correo…'}/>{search && <button aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={15}/></button>}</div>{tab === 'products' ? <select aria-label="Filtrar por estado" value={filter} onChange={e => setFilter(e.target.value)}><option>Todos los estados</option>{statuses.map(s => <option key={s}>{s}</option>)}</select> : <span className="table-hint"><ShieldCheck size={15}/> Miembros registrados</span>}</div>
  <div className="table-scroll"><table><thead>{tab === 'products' ? <tr><th>Equipo</th><th>Código / Serie</th><th>Estado</th><th>Ubicación</th><th>Responsable</th><th><span className="sr-only">Acciones</span></th></tr> : <tr><th>Nombre</th><th>Correo electrónico</th><th>Fecha de registro</th><th>Equipos asignados</th></tr>}</thead><tbody>{loading ? <tr><td colSpan={6}><div className="empty">Cargando información…</div></td></tr> : count === 0 ? <tr><td colSpan={6}><div className="empty"><Search size={28}/><strong>{search || filter !== 'Todos los estados' ? 'No encontramos coincidencias' : tab === 'products' ? 'Tu inventario empieza aquí' : 'Aún no hay usuarios para mostrar'}</strong><p>{search || filter !== 'Todos los estados' ? 'Prueba otra búsqueda o cambia el filtro.' : tab === 'products' ? 'Registra el primer computador de tu empresa.' : 'Las cuentas aparecerán después de registrarse.'}</p>{tab === 'products' && !search && filter === 'Todos los estados' && <button className="primary" onClick={() => setEditing('new')}><Plus size={16}/>Agregar computador</button>}</div></td></tr> : tab === 'products' ? filteredProducts.slice(offset, offset + 8).map(p => <tr key={p.id}><td><div className="device-cell"><span className="device-icon"><Monitor size={22}/></span><div><strong>{p.brand} {p.model}</strong><small>{p.type} · {p.ram_gb} GB RAM</small></div></div></td><td><strong className="asset-code">{p.asset_tag}</strong><small>{p.serial_number}</small></td><td><span className={`badge ${statusClass(p.status)}`}><i/>{p.status}</span></td><td>{p.location}</td><td>{p.assigned_to ? <div className="person-cell"><span className="avatar tiny">{initials(users.find(u => u.id === p.assigned_to)?.full_name || '?')}</span>{users.find(u => u.id === p.assigned_to)?.full_name || 'Usuario'}</div> : <span className="muted">Sin asignar</span>}</td><td><div className="row-actions"><button title="Editar computador" aria-label={`Editar ${p.asset_tag}`} onClick={() => setEditing(p)}><Pencil size={16}/></button><button className="delete-action" title="Eliminar computador" aria-label={`Eliminar ${p.asset_tag}`} onClick={() => setDeleting(p)}><Trash2 size={16}/></button></div></td></tr>) : filteredUsers.slice(offset, offset + 8).map(u => <tr key={u.id}><td><div className="person-cell"><span className="avatar">{initials(u.full_name)}</span><strong>{u.full_name}</strong>{u.id === session?.user.id && <span className="you-tag">Tú</span>}</div></td><td>{u.email}</td><td>{date(u.created_at)}</td><td><span className="equipment-count"><Monitor size={15}/>{products.filter(p => p.assigned_to === u.id).length} equipos</span></td></tr>)}</tbody></table></div>
  <div className="table-footer"><span>{count ? `${offset + 1}–${Math.min(offset + 8, count)}` : '0'} de {count} {tab === 'products' ? 'computadores' : 'usuarios'}</span><div><button aria-label="Página anterior" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}><ChevronLeft size={16}/></button><span>{activePage} / {pages}</span><button aria-label="Página siguiente" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}><ChevronRight size={16}/></button></div></div></section>
  <footer className="page-footer"><span><span className="footer-brand">nexo.</span> Un lugar para cada equipo.</span><span><ShieldCheck size={14}/> {demo ? 'Datos de ejemplo' : 'Acceso autenticado'}</span></footer></main></div>
  {editing && <ProductForm product={editing === 'new' ? null : editing} users={users} onClose={() => setEditing(null)} onSave={save}/>}
  {deleting && <Modal title="Eliminar computador" onClose={() => { if (!busy) setDeleting(null); }}><div className="delete-copy"><span className="danger-icon"><Trash2 size={25}/></span><p>Vas a eliminar <strong>{deleting.brand} {deleting.model} ({deleting.asset_tag})</strong> del inventario.</p><p>Esta acción no se puede deshacer.</p></div><div className="modal-actions"><button className="secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button><button className="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Eliminando…' : 'Eliminar computador'}</button></div></Modal>}
  {help && <Modal title="Tu inventario, paso a paso" onClose={() => setHelp(false)}><div className="help-copy"><p><strong>1. Registra tu equipo.</strong> Selecciona «Nuevo computador» y completa el código, la serie y sus características.</p><p><strong>2. Asigna un responsable.</strong> Selecciona el estado «Asignado» y elige una persona registrada.</p><p><strong>3. Mantén todo al día.</strong> Usa el lápiz para editar o la papelera para eliminar un equipo. Puedes exportar la vista filtrada en CSV.</p><p>La sección Usuarios muestra las cuentas registradas. Todos los miembros tienen acceso al inventario compartido.</p>{demo && <div className="alert success">Esta demostración usa datos de ejemplo. Para guardar información real, conecta Supabase siguiendo README.md e inicia sesión.</div>}</div></Modal>}
  </div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }}><header><div><span className="mini-label">NEXO · INVENTARIO</span><h2 id="modal-title">{title}</h2></div><button aria-label="Cerrar ventana" onClick={onClose}><X size={20}/></button></header>{children}</dialog>;
}

function ProductForm({ product, users, onClose, onSave }: { product: Product | null; users: Profile[]; onClose: () => void; onSave: (data: ProductInput) => Promise<void> }) {
  const [form, setForm] = useState<ProductInput>(() => product ? Object.fromEntries(Object.keys(blank).map(key => [key, product[key as keyof ProductInput]])) as ProductInput : { ...blank });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function field<K extends keyof ProductInput>(key: K, value: ProductInput[K]) { setForm(f => ({ ...f, [key]: value })); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    const parsed = productSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true);
    try { await onSave(parsed.data); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  return <Modal title={product ? 'Editar computador' : 'Nuevo computador'} onClose={() => { if (!busy) onClose(); }}><form onSubmit={submit}><div className="form-body"><div className="form-section-title"><Monitor size={17}/>Información del equipo</div><div className="form-grid">{([
    ['asset_tag', 'Código de inventario', 'PC-007', 40], ['serial_number', 'Número de serie', 'Ej. PF4X2L9', 100], ['brand', 'Marca', 'Ej. Lenovo', 80], ['model', 'Modelo', 'Ej. ThinkPad E14', 120]
  ] as const).map(([key, title, placeholder, max]) => <label key={key}>{title} <span>*</span><input value={form[key]} onChange={e => field(key, e.target.value)} placeholder={placeholder} maxLength={max} required /></label>)}<label>Tipo de equipo<select value={form.type} onChange={e => field('type', e.target.value as ProductInput['type'])}><option>Portátil</option><option>Escritorio</option><option>Todo en uno</option></select></label><label>Procesador<input value={form.processor} onChange={e => field('processor', e.target.value)} placeholder="Ej. Intel Core i5" maxLength={120}/></label><label>Memoria RAM (GB)<input type="number" min={1} max={2048} step={1} value={form.ram_gb} onChange={e => field('ram_gb', e.target.valueAsNumber)} required/></label><label>Almacenamiento (GB)<input type="number" min={1} max={100000} step={1} value={form.storage_gb} onChange={e => field('storage_gb', e.target.valueAsNumber)} required/></label></div><div className="form-section-title"><Cpu size={17}/>Estado y asignación</div><div className="form-grid"><label>Estado<select value={form.status} onChange={e => { const status = e.target.value as ProductInput['status']; setForm(f => ({ ...f, status, assigned_to: status === 'Asignado' ? f.assigned_to : null })); }}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><label>Ubicación <span>*</span><input value={form.location} onChange={e => field('location', e.target.value)} maxLength={120} placeholder="Ej. Oficina principal" required/></label>{form.status === 'Asignado' && <label className="wide">Responsable <span>*</span><select required value={form.assigned_to || ''} onChange={e => field('assigned_to', e.target.value || null)}><option value="">Selecciona un usuario</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>)}</select></label>}<label className="wide">Notas <span className="optional">Opcional</span><textarea rows={3} value={form.notes} onChange={e => field('notes', e.target.value)} placeholder="Detalles adicionales sobre el computador…" maxLength={2000}/></label></div>{error && <div className="alert error" role="alert">{error}</div>}</div><div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}><Check size={17}/>{busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Registrar computador'}</button></div></form></Modal>;
}
