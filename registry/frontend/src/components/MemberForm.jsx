import CheckboxGroup from './CheckboxGroup.jsx';
import FormField from './FormField.jsx';
import Toggle from './Toggle.jsx';
import {
  CONTACT_FIELDS,
  NEEDS_FIELD,
  OFFERS_FIELD,
  SKILLS_FIELD,
} from '../lib/memberForm.js';

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

function SectionEyebrow({ step, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-hch-ink bg-hch-mint text-xs font-black text-hch-ink">
        {step}
      </span>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-hch-ink">{children}</p>
    </div>
  );
}

function FormSection({ step, title, children }) {
  return (
    <div className="hch-form-card space-y-5">
      <SectionEyebrow step={step}>{title}</SectionEyebrow>
      {children}
    </div>
  );
}

function FieldGrid({ fields, form, onFieldChange }) {
  return (
    <div className={GRID}>
      {fields.map(([key, label]) => (
        <FormField key={key} label={label} value={form[key]} onChange={onFieldChange(key)} />
      ))}
    </div>
  );
}

function ChoiceField({ field, form, onToggleList, onFieldChange }) {
  const [key, , options] = field;
  return (
    <CheckboxGroup
      options={options}
      value={form[key]}
      onToggle={(option) => onToggleList(key, option)}
      otherValue={form[`${key}Other`] || ''}
      onOtherChange={onFieldChange(`${key}Other`)}
    />
  );
}

// Shared by first-time onboarding and the later profile editor. `variant`
// only changes where the submit button sits and its label — the fields
// themselves stay in lockstep.
export default function MemberForm({
  variant,
  form,
  onFieldChange,
  onToggleList,
  saving,
  error,
  successMessage,
  onSubmit,
}) {
  const isWelcome = variant === 'welcome';
  const canSubmit = form.firstName.trim() && form.lastName.trim();

  const profileFooter = !isWelcome && (
    <>
      {error && <p className="text-sm font-black text-hch-error">{error}</p>}
      {successMessage && <p className="text-sm font-black text-hch-success">{successMessage}</p>}
      <button type="submit" disabled={saving || !canSubmit} className="hch-form-btn">
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </>
  );

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-7">
      <FormSection step={1} title="Required">
        <div>
          <span className="hch-form-label">Email (sign-in address)</span>
          <p className="font-sans text-sm font-semibold text-hch-ink">{form.email}</p>
        </div>

        <div className={GRID}>
          <FormField
            label="First name"
            required
            value={form.firstName}
            onChange={onFieldChange('firstName')}
          />
          <FormField
            label="Last name"
            required
            value={form.lastName}
            onChange={onFieldChange('lastName')}
          />
        </div>

        <Toggle
          checked={!!form.showEmail}
          onChange={onFieldChange('showEmail')}
          label="Show my email in the directory"
        />
        <Toggle
          checked={!!form.published}
          onChange={onFieldChange('published')}
          label="List me in the public directory"
        />

        {isWelcome && error && <p className="text-sm font-black text-hch-error">{error}</p>}

        {isWelcome && (
          <button type="submit" disabled={saving || !canSubmit} className="hch-form-btn">
            {saving ? 'Saving…' : 'View Registry'}
          </button>
        )}
      </FormSection>

      <FormSection step={2} title="Contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <FormField label="Phone" value={form.phone} onChange={onFieldChange('phone')} />
          <Toggle
            checked={!!form.showPhone}
            onChange={onFieldChange('showPhone')}
            label="Show my phone in the directory"
          />
        </div>
        <FieldGrid fields={CONTACT_FIELDS} form={form} onFieldChange={onFieldChange} />
      </FormSection>

      <FormSection step={3} title="Help">
        <p className="font-sans text-sm font-semibold text-hch-muted-1">
          Skills you can bring.
        </p>
        <ChoiceField field={SKILLS_FIELD} form={form} onToggleList={onToggleList} onFieldChange={onFieldChange} />
      </FormSection>

      <FormSection step={4} title="Offers">
        <p className="font-sans text-sm font-semibold text-hch-muted-1">
          Ways you can show up for other members.
        </p>
        <ChoiceField field={OFFERS_FIELD} form={form} onToggleList={onToggleList} onFieldChange={onFieldChange} />
      </FormSection>

      <FormSection step={5} title="Needs">
        <p className="font-sans text-sm font-semibold text-hch-muted-1">
          What you’re looking for.
        </p>
        <ChoiceField field={NEEDS_FIELD} form={form} onToggleList={onToggleList} onFieldChange={onFieldChange} />
        <FormField
          textarea
          label="Specifics"
          value={form.needsDetail}
          onChange={onFieldChange('needsDetail')}
        />
      </FormSection>

      <FormSection step={6} title="About">
        <FormField textarea label="Bio" value={form.bio} onChange={onFieldChange('bio')} />
        {profileFooter}
      </FormSection>
    </form>
  );
}
