'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormField {
    id: string;
    type: 'text' | 'select' | 'checkbox' | 'textarea' | 'number' | 'date' | 'radio';
    label: string;
    required: boolean;
    options?: string[]; // For select, radio, checkbox
    placeholder?: string;
    section: string; // Which booking type section this belongs to
}

interface BookingType {
    id: string;
    label: string;
    description?: string;
}

interface FormConfig {
    fields: FormField[];
    bookingTypeQuestion: string;
    bookingTypes: BookingType[];
}

export default function FormEditor({ isAdmin }: { isAdmin: boolean }) {
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'fields' | 'booking-types'>('booking-types');

    const [formConfig, setFormConfig] = useState<FormConfig>(() => {
        // Try to load from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bookingFormConfig');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    // Fall through to defaults
                }
            }
        }

        return {
            bookingTypeQuestion: 'What would you like to book?',
            bookingTypes: [
                { id: 'AUDIO', label: 'Audio Advertising', description: 'Premier Gospel, WA, CTY' },
                { id: 'DISPLAY', label: 'Display Advertising', description: 'MPU, Leaderboard, Skyscraper' },
                { id: 'BESPOKE_ESEND', label: 'Bespoke E-sends', description: 'Standalone email campaigns' },
                { id: 'ADS_IN_ESEND', label: 'Ads in E-sends', description: 'Ads within existing newsletters' }
            ],
            fields: [
                { id: 'clientName', type: 'text', label: 'Client / Brand Name', required: true, section: 'general', placeholder: 'e.g. Nike, Premier Digital...' },
                { id: 'contractNumber', type: 'text', label: 'Contract Number', required: false, section: 'general', placeholder: 'Contract #' },
                { id: 'bookerName', type: 'text', label: 'Booked By', required: false, section: 'general', placeholder: 'Your name' },
            ]
        };
    });

    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [showAddField, setShowAddField] = useState(false);
    const [editingBookingType, setEditingBookingType] = useState<BookingType | null>(null);
    const [showAddBookingType, setShowAddBookingType] = useState(false);

    const addField = (field: FormField) => {
        setFormConfig({
            ...formConfig,
            fields: [...formConfig.fields, field]
        });
        setShowAddField(false);
    };

    const updateField = (fieldId: string, updates: Partial<FormField>) => {
        setFormConfig({
            ...formConfig,
            fields: formConfig.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
            )
        });
    };

    const deleteField = (fieldId: string) => {
        if (!confirm('Are you sure you want to delete this field?')) return;
        setFormConfig({
            ...formConfig,
            fields: formConfig.fields.filter(f => f.id !== fieldId)
        });
    };

    const addBookingType = (bookingType: BookingType) => {
        setFormConfig({
            ...formConfig,
            bookingTypes: [...formConfig.bookingTypes, bookingType]
        });
        setShowAddBookingType(false);
    };

    const updateBookingType = (typeId: string, updates: Partial<BookingType>) => {
        setFormConfig({
            ...formConfig,
            bookingTypes: formConfig.bookingTypes.map(t =>
                t.id === typeId ? { ...t, ...updates } : t
            )
        });
    };

    const deleteBookingType = (typeId: string) => {
        if (!confirm('Are you sure you want to delete this booking type?')) return;
        setFormConfig({
            ...formConfig,
            bookingTypes: formConfig.bookingTypes.filter(t => t.id !== typeId)
        });
    };

    const saveFormConfig = async () => {
        try {
            // Save to database or local storage
            localStorage.setItem('bookingFormConfig', JSON.stringify(formConfig));
            alert('Form configuration saved!');
            setEditMode(false);
            router.refresh();
        } catch (error) {
            alert('Failed to save form configuration');
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Form Editor
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Customize the booking form fields, labels, and options
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditMode(!editMode)}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.5rem' }}
                >
                    {editMode ? 'Exit Edit Mode' : 'Edit Form Structure'}
                </button>
            </div>

            {editMode && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem' }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => setActiveTab('booking-types')}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'booking-types' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'booking-types' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Booking Types
                        </button>
                        <button
                            onClick={() => setActiveTab('fields')}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'fields' ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === 'fields' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Form Fields
                        </button>
                    </div>

                    {/* Booking Types Tab */}
                    {activeTab === 'booking-types' && (
                        <div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Main Question Label</label>
                                <input
                                    type="text"
                                    value={formConfig.bookingTypeQuestion}
                                    onChange={(e) => setFormConfig({ ...formConfig, bookingTypeQuestion: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '8px',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>Active Booking Types</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowAddBookingType(true)}
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        background: 'var(--success)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    + Add Booking Type
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {formConfig.bookingTypes.map(type => (
                                    <div
                                        key={type.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: '1rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {type.label}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                ID: {type.id}
                                            </div>
                                            {type.description && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                                    {type.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setEditingBookingType(type)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'var(--primary)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteBookingType(type.id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'var(--danger)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fields Tab */}
                    {activeTab === 'fields' && (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddField(true)}
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        background: 'var(--success)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 500
                                    }}
                                >
                                    + Add New Field
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {formConfig.fields.map(field => (
                                    <div
                                        key={field.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: '1rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Type: {field.type} | Section: {field.section} | ID: {field.id}
                                            </div>
                                            {field.options && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                                                    Options: {field.options.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setEditingField(field)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'var(--primary)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteField(field.id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'var(--danger)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={saveFormConfig}
                            className="btn-primary"
                            style={{ padding: '0.8rem 2rem' }}
                        >
                            Save Form Configuration
                        </button>
                    </div>
                </div>
            )}

            {/* Booking Type Modals */}
            {(showAddBookingType || editingBookingType) && (
                <BookingTypeModal
                    type={editingBookingType || undefined}
                    onSave={(t) => {
                        if (editingBookingType) {
                            updateBookingType(editingBookingType.id, t);
                            setEditingBookingType(null);
                        } else {
                            addBookingType(t as BookingType);
                            setShowAddBookingType(false);
                        }
                    }}
                    onCancel={() => {
                        setEditingBookingType(null);
                        setShowAddBookingType(false);
                    }}
                />
            )}

            {/* Field Editor Modal */}
            {editingField && (
                <FieldEditorModal
                    field={editingField}
                    onSave={(updates) => {
                        updateField(editingField.id, updates);
                        setEditingField(null);
                    }}
                    onCancel={() => setEditingField(null)}
                />
            )}

            {/* Add Field Modal */}
            {showAddField && (
                <AddFieldModal
                    onAdd={addField}
                    onCancel={() => setShowAddField(false)}
                />
            )}
        </div>
    );
}

// Field Editor Modal Component
function FieldEditorModal({ field, onSave, onCancel }: {
    field: FormField;
    onSave: (updates: Partial<FormField>) => void;
    onCancel: () => void;
}) {
    const [label, setLabel] = useState(field.label);
    const [required, setRequired] = useState(field.required);
    const [placeholder, setPlaceholder] = useState(field.placeholder || '');
    const [options, setOptions] = useState(field.options?.join('\n') || '');

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Edit Field: {field.id}</h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={required}
                                onChange={e => setRequired(e.target.checked)}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '0.9rem' }}>Required field</span>
                        </label>
                    </div>

                    {field.type === 'text' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Placeholder</label>
                            <input
                                type="text"
                                value={placeholder}
                                onChange={e => setPlaceholder(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                    )}

                    {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Options (one per line)
                            </label>
                            <textarea
                                value={options}
                                onChange={e => setOptions(e.target.value)}
                                rows={5}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave({
                            label,
                            required,
                            placeholder: placeholder || undefined,
                            options: options ? options.split('\n').filter(o => o.trim()) : undefined
                        })}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add Field Modal Component
function AddFieldModal({ onAdd, onCancel }: {
    onAdd: (field: FormField) => void;
    onCancel: () => void;
}) {
    const [id, setId] = useState('');
    const [type, setType] = useState<FormField['type']>('text');
    const [label, setLabel] = useState('');
    const [required, setRequired] = useState(false);
    const [section, setSection] = useState('general');
    const [placeholder, setPlaceholder] = useState('');
    const [options, setOptions] = useState('');

    const handleAdd = () => {
        if (!id || !label) {
            alert('ID and Label are required');
            return;
        }

        onAdd({
            id,
            type,
            label,
            required,
            section,
            placeholder: placeholder || undefined,
            options: options ? options.split('\n').filter(o => o.trim()) : undefined
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '2rem 0'
        }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', margin: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Add New Field</h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Field ID (unique)</label>
                        <input
                            type="text"
                            value={id}
                            onChange={e => setId(e.target.value.replace(/\s/g, '_').toLowerCase())}
                            placeholder="e.g. custom_field_1"
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Field Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as FormField['type'])}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        >
                            <option value="text">Text</option>
                            <option value="textarea">Text Area</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="checkbox">Checkboxes</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Label</label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Custom Question"
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Section</label>
                        <select
                            value={section}
                            onChange={e => setSection(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        >
                            <option value="general">General</option>
                            <option value="audio">Audio</option>
                            <option value="display">Display</option>
                            <option value="bespoke_esend">Bespoke E-send</option>
                            <option value="ads_in_esend">Ads in E-send</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={required}
                                onChange={e => setRequired(e.target.checked)}
                                style={{ accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '0.9rem' }}>Required field</span>
                        </label>
                    </div>

                    {type === 'text' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Placeholder (optional)</label>
                            <input
                                type="text"
                                value={placeholder}
                                onChange={e => setPlaceholder(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                    )}

                    {(type === 'select' || type === 'radio' || type === 'checkbox') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Options (one per line)
                            </label>
                            <textarea
                                value={options}
                                onChange={e => setOptions(e.target.value)}
                                rows={5}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        Add Field
                    </button>
                </div>
            </div>
        </div>
    );
}

// Booking Type Modal Component
function BookingTypeModal({ type, onSave, onCancel }: {
    type?: BookingType;
    onSave: (type: Partial<BookingType>) => void;
    onCancel: () => void;
}) {
    const [id, setId] = useState(type?.id || '');
    const [label, setLabel] = useState(type?.label || '');
    const [description, setDescription] = useState(type?.description || '');

    const handleSave = () => {
        if (!id || !label) {
            alert('ID and Label are required');
            return;
        }

        onSave({
            id,
            label,
            description: description || undefined
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{type ? 'Edit Booking Type' : 'Add Booking Type'}</h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Booking Type ID (Unique Code)</label>
                        <input
                            type="text"
                            value={id}
                            onChange={e => setId(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                            placeholder="e.g. PODCAST_AD"
                            disabled={!!type} // Disable ID editing for existing types
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: type ? 'rgba(255,255,255,0.1)' : 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)',
                                opacity: type ? 0.7 : 1
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Label (Displayed Name)</label>
                        <input
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Podcast Advertising"
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Pre-roll, Mid-roll ads on podcasts"
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.2rem' }}
                    >
                        Save Booking Type
                    </button>
                </div>
            </div>
        </div>
    );
}
