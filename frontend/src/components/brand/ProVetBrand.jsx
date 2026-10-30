import logoDog from '../../assets/provet-silueta-logo-fiel.png'
import backgroundDog from '../../assets/provet-silueta-fondo-fiel.png'

export function DogSilhouette({ className = '', title, variant = 'logo' }) {
  return <img className={className} src={variant === 'background' ? backgroundDog : logoDog} alt={title || ''} aria-hidden={title ? undefined : true} />
}

export default function ProVetBrand({ className = '', compact = false }) {
  return <div className={`provet-brand ${compact ? 'provet-brand-compact' : ''} ${className}`.trim()} aria-label="Pro-Vet, Sanatorio Veterinario">
    <span className="provet-brand-mark"><DogSilhouette /></span>
    <span className="provet-brand-copy">
      <span className="provet-brand-name">PRO-<strong>VET</strong></span>
      <span className="provet-brand-subtitle">SANATORIO VETERINARIO</span>
    </span>
  </div>
}
