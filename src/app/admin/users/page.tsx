'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/actions/users';
import { useAuth } from '@/lib/auth-context';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const { session } = useAuth();
    
    // Form fields
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'USER'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'USER' });
        setModalOpen(true);
    };

    const handleOpenEdit = (user: any) => {
        setEditingUser(user);
        setFormData({ 
            email: user.email, 
            password: '', 
            name: user.name || '', 
            role: user.role 
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Remove password if empty (no change)
                const dataToUpdate = { ...formData };
                if (!dataToUpdate.password) delete (dataToUpdate as any).password;
                await updateUser(editingUser.id, dataToUpdate);
            } else {
                await createUser(formData);
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert('Error saving user');
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (email === session?.email) {
            alert("You cannot delete yourself!");
            return;
        }
        if (confirm(`Are you sure you want to delete ${email}?`)) {
            await deleteUser(id);
            fetchUsers();
        }
    };

    return (
        <main className="grid-dashboard">
            <Sidebar />
            <section style={{ padding: '2rem', minHeight: '100vh' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Management</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage system access and permissions</p>
                    </div>
                    <button 
                        onClick={handleOpenCreate}
                        className="btn-primary" 
                        style={{ background: 'var(--primary)' }}
                    >
                        ➕ Add New User
                    </button>
                </header>

                <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '1.2rem', fontWeight: 600 }}>Name & Email</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600 }}>Role</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600 }}>Created At</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: 600 }}>{user.name || 'No Name'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700, 
                                                padding: '0.25rem 0.6rem', 
                                                borderRadius: '6px',
                                                background: user.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: user.role === 'ADMIN' ? '#60a5fa' : 'var(--text-muted)',
                                                border: user.role === 'ADMIN' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleOpenEdit(user)}
                                                    style={{ 
                                                        background: 'transparent', 
                                                        border: '1px solid var(--border-subtle)', 
                                                        color: 'white', 
                                                        padding: '0.4rem 0.8rem', 
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    disabled={user.email === session?.email}
                                                    style={{ 
                                                        background: 'rgba(239, 68, 68, 0.1)', 
                                                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                        color: '#f87171', 
                                                        padding: '0.4rem 0.8rem', 
                                                        borderRadius: '6px',
                                                        cursor: user.email === session?.email ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.8rem',
                                                        opacity: user.email === session?.email ? 0.5 : 1
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Modal */}
            {modalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <button 
                            onClick={() => setModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
                        >
                            ×
                        </button>
                        
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="John Doe"
                                    style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }} 
                                />
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@premier.org.uk"
                                    style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }} 
                                />
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <input 
                                    type="password" 
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••"
                                    style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }} 
                                />
                            </div>

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>System Role</label>
                                <select 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white' }}
                                >
                                    <option value="USER">Standard User</option>
                                    <option value="ADMIN">System Administrator</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                                {editingUser ? 'Update Permissions' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
