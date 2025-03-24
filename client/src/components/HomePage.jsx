import { Award, Calendar, ChevronDown, Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Scissors, Star, User, Video } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DCreativoFooterPromo from '../components/DCreativoFooterPromo';
import { useAuth } from '../context/AuthContext';

// CSS Aggiuntivo per il componente DCreativo
const dCreativoStyles = `
  .service-icon-wrapper {
    background: var(--accent);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .service-icon-wrapper .icon-white {
    color: white;
  }

  .service-card:hover .service-icon-wrapper {
    transform: scale(1.1);
  }

  .animate-pulse-slow {
    animation: pulse 3s infinite;
  }

  @keyframes pulse {
    0% { opacity: 0; }
    50% { opacity: 0.1; }
    100% { opacity: 0; }
  }

  /* Stili per la sezione DCreativo */
  .dcreativo-footer-promo {
    position: relative;
    overflow: hidden;
  }

  .dcreativo-footer-promo .bg-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  .dcreativo-footer-promo .service-card {
    position: relative;
    z-index: 1;
  }

  .dcreativo-footer-promo .service-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    background: var(--accent);
    opacity: 0.1;
    transition: height 0.3s ease;
    z-index: -1;
  }

  .dcreativo-footer-promo .service-card:hover::after {
    height: 100%;
  }
   /* Enhanced animations for DCreativo promo elements */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes glowing {
  0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
  100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Add these classes to your global CSS */
.promo-button-3d {
  transform: perspective(1000px) rotateX(0deg);
  transition: all 0.3s ease;
}

.promo-button-3d:hover {
  transform: perspective(1000px) rotateX(5deg);
}

.promo-badge {
  position: absolute;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: float 3s ease-in-out infinite;
}

.shimmer-bg {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
}

/* Enhance the CTA button */
.enhanced-cta-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: glowing 2s infinite;
}

.enhanced-cta-button:hover {
  transform: translateY(-3px);
}

.enhanced-cta-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.enhanced-cta-button:hover::after {
  transform: scale(1);
  opacity: 1;
}

/* Improved scrollbar for better UX */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--accent, #4F46E5);
  border-radius: 5px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

/* Accessibility improvements */
.focus-visible:focus-visible {
  outline: 2px solid var(--accent, #4F46E5);
  outline-offset: 2px;
}

/* Add smooth transitions for theme changes */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Enhanced tab focus styles for keyboard navigation */
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent, #4F46E5);
  outline-offset: 2px;
}
  /* Effetto pulsante principale */
.dcreativo-cta-main {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
}

.dcreativo-cta-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.6);
}

.dcreativo-cta-main::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.dcreativo-cta-main:hover::after {
  transform: scale(1);
  opacity: 1;
}

/* Pulsante "Scopri di più" */
.dcreativo-cta-secondary {
  position: relative;
  transition: all 0.3s ease;
}

.dcreativo-cta-secondary:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

/* Animazione pulsante scopri */
@keyframes bounce-horizontal {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(5px); }
}

.dcreativo-cta-secondary:hover svg {
  animation: bounce-horizontal 1s ease infinite;
}

/* Stile per il contenitore del footer promo */
.dcreativo-footer-promo-container {
  transition: max-height 0.5s ease, opacity 0.5s ease;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.dcreativo-footer-promo-container.visible {
  max-height: 2000px; /* Un valore grande per contenere il contenuto */
  opacity: 1;
}

/* Pulsatione leggera per attirare l'attenzione */
@keyframes soft-pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.pulse-attention {
  animation: soft-pulse 2s infinite;
}
  /* Pulsazione più sottile per il bordo luminoso */
@keyframes pulse-subtle {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s infinite;
}

/* Pulsazione per lo sticker "Scopri di più" */
@keyframes pulse-stronger {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-pulse-stronger {
  animation: pulse-stronger 2s infinite;
}

/* Rimbalzo verticale per la freccia */
@keyframes bounce-vertical {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

.animate-bounce-vertical {
  animation: bounce-vertical 1s infinite;
}

/* Effetto di brillantezza per il pulsante CTA */
@keyframes shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.shine-effect {
  position: relative;
  overflow: hidden;
}

.shine-effect::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}
   /* Video Gallery Section Styles */
  .video-gallery-section {
    position: relative;
    overflow: hidden;
    background-color: var(--bg-secondary);
  }

  .video-gallery-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to bottom, var(--bg-primary), transparent);
    z-index: 1;
  }

  .video-gallery-section::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, var(--bg-primary), transparent);
    z-index: 1;
  }

  .video-container {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .video-container:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.4);
  }

  .video-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid var(--accent);
    border-radius: 12px;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 2;
    pointer-events: none;
  }

  .video-container:hover .video-border {
    opacity: 0.6;
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
    transition: all 0.3s ease;
    aspect-ratio: 16/9;
  }

  .gallery-title-accent {
    position: relative;
    display: inline-block;
  }

  .gallery-title-accent::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--accent);
    border-radius: 3px;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .video-container {
      margin-bottom: 1.5rem;
    }
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%);
    border-radius: 12px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
    z-index: 1;
  }

  .video-container:hover .video-overlay {
    opacity: 0.4;
  }

  .video-label {
    position: absolute;
    bottom: 15px;
    left: 15px;
    color: white;
    font-weight: bold;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    z-index: 2;
    transition: all 0.3s ease;
  }

  .video-container:hover .video-label {
    transform: translateY(-5px);
  }

  .video-icon-wrapper {
    position: absolute;
    top: 15px;
    right: 15px;
    background: var(--accent);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    opacity: 0.8;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .video-container:hover .video-icon-wrapper {
    transform: scale(1.1);
    opacity: 1;
  }


/* Stili mobile-friendly */
@media (max-width: 768px) {
  .mobile-extra-visible {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
    font-weight: 700;
  }

  /* Dimensioni aumentate per tocco su mobile */
  .mobile-touch-target {
    min-height: 48px;
    min-width: 48px;
  }
}

/* Aggiunta ombre migliorate per contrasto anche su sfondi scuri */
.enhanced-visibility {
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 2px rgba(59, 130, 246, 0.3);
}
    /* Animazione di pulsazione con contrasto molto più evidente */
@keyframes high-contrast-pulse {
  0% {
    opacity: 0.8;
    transform: scale(1) rotate(12deg);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) rotate(12deg);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.4);
  }
  100% {
    opacity: 0.8;
    transform: scale(1) rotate(12deg);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
}

/* Classe per applicare l'animazione migliorata */
.high-contrast-sticker {
  animation: high-contrast-pulse 2s infinite;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 1px solid rgba(255, 255, 255, 0.8);
  /* Ombra interna per maggiore definizione */
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.4);
}

/* Ottimizzazione per mobile */
@media (max-width: 768px) {
  .high-contrast-sticker {
    /* Aumento dimensioni per mobile */
    padding: 6px 12px;
    /* Ombra più pronunciata per migliore visibilità */
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.1),
      0 6px 12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.3);
    /* Bordo più spesso e visibile */
    border-width: 2px;
  }

  /* Testo con maggiore visibilità su mobile */
  .high-contrast-sticker span {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

/* Effetti di hover per desktop */
@media (min-width: 769px) {
  .high-contrast-sticker:hover {
    transform: scale(1.1) rotate(12deg) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.5) !important;
    transition: all 0.3s ease;
  }
}
`;
// Componente DCreativoPromoLink aggiornato con sticker promozionale
const DCreativoPromoLink = ({ onClick }) => {
  return (
    <div className="relative mt-8 flex justify-center">
      {/* Pulsante principale - invariato */}
      <button
        onClick={onClick}
        className="relative py-3 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 mx-auto group z-10"
        aria-label="Sistema di prenotazioni sviluppato da DCreativo"
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        <span className="flex items-center">
          <span className="text-lg font-medium mr-2">✨</span>
          <span>Sistema di prenotazioni sviluppato da DCreativo</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-y-1 transition-transform">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {/* Sticker pubblicitario migliorato con contrasto maggiore */}
      <div className="absolute -top-14 -right-5 md:-right-12 transform rotate-12 bg-gradient-to-br from-red-400 to-red-700 text-white px-4 py-2 rounded-lg shadow-lg high-contrast-sticker">
        <div className="relative flex items-center">
          <span className="font-bold text-sm md:text-base whitespace-nowrap drop-shadow-md">Scopri di più!</span>
          <svg className="w-4 h-4 ml-1 animate-bounce drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
          {/* Bordo bianco per aumentare il contrasto */}
          <div className="absolute inset-0 border-2 border-white rounded-lg opacity-40"></div>
          {/* Freccia curva che punta al pulsante - più grande e visibile */}
          <svg className="absolute -bottom-6 -right-6 w-10 h-10 text-red-600 filter drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};
// Componente per visualizzare una singola card di servizio
const ServiceCard = ({ icon, title, description, price, user }) => {
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
      <div className="flex items-center mb-4">
        <div className="service-icon-wrapper">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="mb-4 text-[var(--text-primary)] text-opacity-80">{description}</p>
      <div className="flex justify-between items-center">
        <p className="text-[var(--accent)] font-bold">{price}</p>
        <Link to={user ? "/booking" : "/guest-booking"} className="text-sm text-[var(--accent)] hover:underline font-medium flex items-center">
          Prenota <ChevronDown className="w-4 h-4 ml-1 transform rotate-270" />
        </Link>
      </div>
    </div>
  );
};

// Video component for a single video in the gallery
const VideoItem = ({ src, title, index }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Preload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  return (
    <div className="video-container h-full">
      <div className="video-border"></div>
      <div className="video-overlay"></div>
      <video
        ref={videoRef}
        className="video-element"
        autoPlay={index === 0} // Auto-play only the first video
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
        Il tuo browser non supporta i video HTML5.
      </video>
      <div className="video-label">{title}</div>
      <div className="video-icon-wrapper">
        <Video className="icon-white w-5 h-5" />
      </div>
    </div>
  );
};

const HomePage = React.memo(() => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState({});
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showDCreativoPromo, setShowDCreativoPromo] = useState(false);

  const sectionRefs = {
    hero: useRef(null),
    services: useRef(null),
    about: useRef(null),
    testimonials: useRef(null),
    contact: useRef(null),
    videoGallery: useRef(null) // New reference for the video gallery section
  };



  // Scroll to section with smooth animation
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Set up intersection observer to trigger animations when scrolling
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));

          // Auto-play video when it becomes visible
          if (entry.target.id === 'video-gallery' && entry.isIntersecting) {
            const videos = entry.target.querySelectorAll('video');
            videos.forEach(video => {
              if (video.paused) {
                video.play().catch(err => console.log('Auto-play prevented:', err));
              }
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    // Osserva anche la sezione DCreativo se esiste
    if (handleDCreativoSectionRef.current) {
      observer.observe(handleDCreativoSectionRef.current);
    }

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });

      if (handleDCreativoSectionRef.current) {
        observer.unobserve(handleDCreativoSectionRef.current);
      }
    };
  }, []);

  // Mostra la promozione DCreativo dopo 3 secondi dalla visualizzazione della pagina
  useEffect(() => {
    setShowDCreativoPromo(false); // Assicura che sia chiuso all'avvio
  }, []);

  // Auto-rotate testimonials
useEffect(() => {
  const interval = setInterval(() => {
    setActiveTestimonial((prev) => (prev + 1) % 6);  // Modifica da % 3 a % 6
  }, 5000);

  return () => clearInterval(interval);
}, []);

  // Animation classes based on visibility
  const getAnimationClass = (sectionId) => {
    return isVisible[sectionId] ? 'animate-fade-in opacity-100 translate-y-0' : 'opacity-0 translate-y-10';
  };

  // Aggiungi riferimento al componente da promuovere
  const handleDCreativoSectionRef = useRef(null);

  // Scroll to DCreativo section with proper positioning at the top
  const scrollToDCreativoSection = () => {
    // Breve timeout per assicurarci che il componente sia renderizzato
    setTimeout(() => {
      if (handleDCreativoSectionRef.current) {
        // Calcola la posizione corretta con offset per mobile e desktop
        const isMobile = window.innerWidth < 768;
        const yOffset = isMobile ? -100 : -50; // Offset maggiore per mobile

        const element = handleDCreativoSectionRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }
    }, 300); // Attendi un po' più a lungo per dispositivi mobili
  };

  // Videos data
  const videos = [
    {
      src: "/videos/salon-main1.mp4",
      title: "Area Principale"
    },
    {
      src: "/videos/salon-main2.mp4",
      title: "Vista Panoramica"
    },
    {
      src: "/videos/salon-main3.mp4",
      title: "Esperienza Cliente"
    },
    {
      src: "/videos/salon-main4.mp4",
      title: "L'Esperienza Completa"
    }
  ];

  return (
    <div className="home-page min-h-screen overflow-x-hidden">
      {/* Hero Section with Parallax Effect */}
      <section
        id="hero"
        ref={sectionRefs.hero}
        className="hero-section min-h-screen flex items-center justify-center relative py-20 px-4 overflow-hidden stabilize-render"
      >
        {/* Container per lo sfondo con parallax effect */}
        <div className="absolute inset-0 z-0 parallax-background">
          {/* Immagine di sfondo ad alta risoluzione con classe ottimizzata */}
          <div
            className="hero-image high-quality-image transition-transform duration-700"
            style={{
              backgroundImage: 'url("/shot-img2.png")',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              transform: isVisible.hero ? 'scale(1.05)' : 'scale(1)'
            }}
          ></div>

          {/* Overlay per tema scuro con classes ottimizzate */}
          <div className="hero-overlay-dark"></div>

          {/* Overlay per tema chiaro con classes ottimizzate */}
          <div className="hero-overlay-light"></div>

          {/* Effetto vignetta per migliorare la leggibilità sui bordi */}
          <div className="absolute inset-0 z-0 box-shadow-vignette opacity-60"></div>
        </div>

        {/* Contenuto della hero section con classi ottimizzate */}
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          {/* Titolo con classe ottimizzata per l'effetto glow */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white animate-text-shadow-pulse tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[var(--accent)] to-white">
              Your Style Barber Studio
            </span>
          </h1>

          {/* Sottotitolo con classe ottimizzata per il testo */}
          <p className="text-xl md:text-2xl lg:text-3xl mb-10 animate-fade-in text-white font-medium tracking-wide">
            Il tuo stile, <span className="text-[var(--accent)]">la nostra passione</span>
          </p>

          <div className="mt-10 animate-slide-up">
            {user ? (
              <div className="space-y-6">
                <p className="text-xl text-white font-medium">
                  Bentornato, <span className="text-[var(--accent)]">{user.firstName}!</span>
                </p>
                <div>
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="button-enhanced group relative overflow-hidden bg-[var(--accent)] text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10">Dashboard Admin</span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    </Link>
                  ) : user.role === 'barber' ? (
                    <Link
                      to="/barber"
                      className="button-enhanced group relative overflow-hidden bg-[var(--accent)] text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10">Pannello Barbiere</span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    </Link>
                  ) : (
                    <Link
                      to="/booking"
                      className="button-enhanced group relative overflow-hidden bg-[var(--accent)] text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <span className="relative z-10">Prenota Ora</span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xl mb-6 text-white font-medium">
                  Prenota il tuo appuntamento oggi stesso
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    to="/login"
                    className="button-enhanced group relative overflow-hidden bg-[var(--accent)] text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <User className="w-5 h-5" />
                      Accedi
                    </span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  </Link>
                  <Link
                    to="/register"
                    className="group relative overflow-hidden bg-gray-700 text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <User className="w-5 h-5" />
                      Registrati
                    </span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  </Link>
                  <Link
                    to="/guest-booking"
                    className="group relative overflow-hidden bg-gray-700 text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Prenota come ospite
                    </span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-16">
            <button
              onClick={() => scrollToSection('services')}
              className="text-white hover:text-[var(--accent)] transition-colors flex flex-col items-center gap-2 mx-auto font-medium"
              aria-label="Scorri verso il basso per scoprire i nostri servizi"
            >
              <span>Scopri di più</span>
              <ChevronDown className="w-8 h-8 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* Services Section with Card Animations */}
      <section
        id="services"
        ref={sectionRefs.services}
        className={`py-20 px-4 bg-[var(--bg-secondary)] transition-all duration-1000 ${getAnimationClass('services')}`}
      >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--accent)]">
            I Nostri Servizi
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-12 text-[var(--text-primary)] opacity-80">
            Offriamo un'ampia gamma di servizi professionali per soddisfare ogni tua esigenza
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* TAGLIO CAPELLI */}
            <ServiceCard
              icon={<Scissors className="icon-white" />}
              title="Taglio Capelli"
              description="Taglio professionale personalizzato in base alla forma del viso e alle preferenze personali."
              price="CHF 30"
              user={user}
            />

            {/* High Definition */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="M7 21L4 18"></path>
                  <path d="M7 21L10 18"></path>
                  <path d="M17 21l3-3"></path>
                  <path d="M17 21l-3-3"></path>
                  <rect width="16" height="13" x="4" y="3" rx="1"></rect>
                  <path d="M8 12h8"></path>
                  <path d="M12 8v8"></path>
                </svg>
              }
              title="High Definition"
              description="Taglio di precisione con finiture dettagliate per un look definito e impeccabile."
              price="CHF 35"
              user={user}
            />

            {/* BARBA */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                <circle cx="12" cy="6" r="3"></circle>
                <path d="M12 9v2"></path>
                <path d="M9 14l3 3 3-3"></path>
                <path d="M9 18h6"></path>
                <path d="M8 14h8"></path>
                <path d="M10 20l-2 2"></path>
                <path d="M14 20l2 2"></path>
              </svg>
              }
              title="Barba Modellata"
              description="Rifinitura e modellamento della barba con panno caldo, per un look impeccabile."
              price="CHF 25"
              user={user}
            />

            {/* BARBA LUNGA HIPSTER */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M12 12v4"></path>
                <path d="M8 20c0-2 1-4 4-4s4 2 4 4"></path>
                <path d="M10 16.5L8.5 20"></path>
                <path d="M14 16.5l1.5 3.5"></path>
                <path d="M9 17l-2 3"></path>
                <path d="M15 17l2 3"></path>
              </svg>
              }
              title="Barba Lunga Hipster"
              description="Styling e cura della barba lunga per un look distintivo e alla moda."
              price="CHF 30"
              user={user}
            />

            {/* BARBA EXPRESS */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="M10 15c-1.5-1-5-1-5-3v8h5"></path>
                  <path d="M14 15c1.5-1 5-1 5-3v8h-5"></path>
                  <path d="M8.5 10A3.5 3.5 0 0 1 12 6.5a3.5 3.5 0 0 1 3.5 3.5"></path>
                  <path d="M3 3v4"></path>
                  <path d="m7 3-3 4"></path>
                </svg>
              }
              title="Barba Express"
              description="Servizio rapido di rifinitura barba per chi ha fretta ma non vuole rinunciare alla cura."
              price="CHF 15"
              user={user}
            />

            {/* TAGLIO + BARBA */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="M7 8c0 1.5-.5 2-2 3 1.5 1 2 1.5 2 3"></path>
                  <path d="M17 8c0 1.5.5 2 2 3-1.5 1-2 1.5-2 3"></path>
                  <circle cx="12" cy="7" r="3"></circle>
                  <path d="M9 22v-8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8"></path>
                  <path d="M18 22v-4"></path>
                  <path d="M6 22v-4"></path>
                  <circle cx="18" cy="17" r="1"></circle>
                  <circle cx="6" cy="17" r="1"></circle>
                </svg>
              }
              title="Taglio + Barba"
              description="Combinazione di taglio di capelli e modellamento barba per un look completo e curato."
              price="CHF 45"
              user={user}
            />

            {/* TAGLIO BAMBINO UNDER 10 */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                <circle cx="12" cy="6" r="3"></circle>
                <path d="M18 14l-6-2-6 2"></path>
                <path d="M12 16v5"></path>
                <path d="M9 12H4"></path>
                <path d="M20 12h-5"></path>
                <path d="M8 20l-1 2"></path>
                <path d="M16 20l1 2"></path>
              </svg>
              }
              title="Taglio Bambino"
              description="Taglio speciale per bambini fino a 10 anni, in un ambiente accogliente e divertente."
              price="CHF 20"
              user={user}
            />

            {/* UNIVERSITARI */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              }
              title="Universitari"
              description="Offerta speciale per studenti universitari con presentazione del tesserino."
              price="CHF 25"
              user={user}
            />

            {/* OVER 65 */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-3.5-3.5"></path>
                  <path d="M17 21h.01"></path>
                  <path d="M19 17h.01"></path>
                </svg>
              }
              title="Over 65"
              description="Servizio dedicato per la cura dei capelli dei nostri clienti senior."
              price="CHF 25"
              user={user}
            />

            {/* HAIR TATTOO */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <circle cx="7" cy="7" r="3"></circle>
                  <path d="m9 9 1.5 1.5"></path>
                  <path d="M5 2h3.5M2 5v3.5"></path>
                  <path d="M14 6h5M14 10h5"></path>
                  <rect width="10" height="7" x="10" y="13" rx="1"></rect>
                </svg>
              }
              title="Hair Tattoo"
              description="Disegni personalizzati e creativi realizzati con tecniche professionali di precisione."
              price="Da CHF 5"
              user={user}
            />

            {/* SERVIZI TECNICI */}
            <ServiceCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-white">
                  <path d="m14 5-3 3-2-2"></path>
                  <path d="m14 11-3 3-2-2"></path>
                  <path d="m14 17-3 3-2-2"></path>
                  <path d="M6 9h10"></path>
                  <path d="M6 15h10"></path>
                  <path d="M6 21h10"></path>
                </svg>
              }
              title="Servizi Tecnici"
              description="Permanente, stiratura alla keratina, decolorazione e colorazione professionale."
              price="Da CHF 30"
              user={user}
            />

            {/* CTA Card */}
            <div className="bg-[var(--accent)] p-6 rounded-lg shadow-lg text-white transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl relative overflow-hidden cta-card">
              <div className="absolute inset-0 bg-white opacity-0 animate-pulse-slow"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 text-white">Prenota Ora</h3>
                <p className="mb-6 text-white">Scegli il servizio e prenota il tuo appuntamento in pochi click.</p>
                <Link
                  to={user ? "/booking" : "/guest-booking"}
                  className="inline-block bg-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all hover:shadow-md cta-button"
                >
                  Prenota
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO GALLERY SECTION - NEW SECTION */}
      <section
        id="video-gallery"
        ref={sectionRefs.videoGallery}
        className={`video-gallery-section py-20 px-4 bg-[var(--bg-primary)] transition-all duration-1000 ${getAnimationClass('video-gallery')}`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gallery-title-accent text-[var(--accent)]">Visita Virtuale</span>
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-[var(--text-primary)] opacity-80">
              Esplora il nostro salone attraverso questi video e scopri l'ambiente in cui lavoriamo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.map((video, index) => (
              <div key={index} className="h-full aspect-video">
                <VideoItem
                  src={video.src}
                  title={video.title}
                  index={index}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to={user ? "/booking" : "/guest-booking"}
              className="inline-block bg-[var(--accent)] text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all hover:shadow-xl transform hover:-translate-y-1"
            >
              Prenota la tua esperienza
            </Link>
          </div>
        </div>
      </section>

      {/* About Section with Parallax and Image Reveal */}
      <section
        id="about"
        ref={sectionRefs.about}
        className={`py-20 px-4 bg-[var(--bg-secondary)] transition-all duration-1000 ${getAnimationClass('about')}`}
      >

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="relative mb-4">
                <div className="w-16 h-1 bg-[var(--accent)]"></div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--accent)]">
                Il Nostro Salone
              </h2>
              <p className="mb-4 text-lg text-[var(--text-primary)] text-opacity-80">
                Your Style Barber Studio è sinonimo di eleganza e professionalità.
              </p>
              <p className="mb-6 text-lg text-[var(--text-primary)] text-opacity-80">
                La nostra missione è offrire un'esperienza unica, combinando tecniche tradizionali con le ultime tendenze per garantire risultati impeccabili.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-[var(--accent)] mr-2" />
                    <span className="font-medium">Orari</span>
                  </div>
                  <p className="text-sm">Lunedì: 14:00-19:00</p>
                  <p className="text-sm">Mar-Sab: 9:00-19:00</p>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center mb-2">
                    <Award className="w-5 h-5 text-[var(--accent)] mr-2" />
                    <span className="font-medium">Qualità</span>
                  </div>
                  <p className="text-sm">Barbieri Certificati</p>
                  <p className="text-sm">Prodotti Premium</p>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 rounded-lg overflow-hidden shadow-xl relative group">
              {/* Image wrapper with hover effect */}
              <div className="relative overflow-hidden transform transition-transform duration-700 hover:scale-105">
                <img
                  src="/barber-shop.jpg"
                  alt="Your Style Barber Studio"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              </div>
              {/* Decorative borders */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[var(--accent)] opacity-70"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[var(--accent)] opacity-70"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section with Modern Card Design */}
      <section
        id="testimonials"
        ref={sectionRefs.testimonials}
        className={`py-20 px-4 bg-[var(--bg-secondary)] transition-all duration-1000 ${getAnimationClass('testimonials')}`}
      >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--accent)]">
            Cosa Dicono i Clienti
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-12 text-[var(--text-primary)] opacity-80">
            Le opinioni di chi ha scelto la nostra esperienza e professionalità
          </p>

          {/* Desktop Testimonials - Grid Layout */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Santiago è assolutamente il miglior barbiere in città. Un ragazzo disponibile, simpatico ma soprattutto tanto professionale. Straconsiglio di provare un taglio da lui!"
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">MF</div>
                </div>
                <div>
                  <h3 className="font-bold">Marco Felaco</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Bravi! Mio figlio L. è sempre contento e anche i suoi amici si sono trovati bene."
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">RG</div>
                </div>
                <div>
                  <h3 className="font-bold">Rossana Galli</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Porto i ragazzi e sono sempre soddisfatti.
                  professionale e sempre gentile, luogo pulito."
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">RM</div>
                </div>
                <div>
                  <h3 className="font-bold">Rossano Mantegazzi</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Dopo aver provato tanti barbieri in città, ho finalmente trovato quello di fiducia! Santiago è stato competente, attento e simpatico, lo consiglio a tutti!"
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">GP</div>
                </div>
                <div>
                  <h3 className="font-bold">Gianmaria Parigi-Bini</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Da quando vado da Santi sono sempre stato soddisfatto del mio taglio. Ottima professionalità e cura al dettaglio. In più è una persona accogliente che ti mette a tuo agio e offre sempre un caffè o qualcosa da bere."
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">PC</div>
                </div>
                <div>
                  <h3 className="font-bold">Patrick Cali</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                  "Locale pulito, personale gentile e preparato. Sono sempre aggiornati sui tagli del momento, il signor Mario è davvero molto bravo!"
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">FD</div>
                </div>
                <div>
                  <h3 className="font-bold">Fabio De Santis</h3>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Testimonials - Carousel/Slider */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {/* Testimonial 1 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Santiago è assolutamente il miglior barbiere in città. Un ragazzo disponibile, simpatico ma soprattutto tanto professionale."
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">MF</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Marco Felaco</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Bravi! Mio figlio L. è sempre contento e anche i suoi amici si sono trovati bene."
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">RG</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Rossana Galli</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Porto i ragazzi e sono sempre soddisfatti. Professionale e sempre gentile, luogo pulito."
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">RM</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Rossano Mantegazzi</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial 4 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Dopo aver provato tanti barbieri in città, ho finalmente trovato quello di fiducia! Santiago è stato competente, attento e simpatico, lo consiglio a tutti!"
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">GP</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Gianmaria Parigi-Bini</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial 5 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Da quando vado da Santi sono sempre stato soddisfatto del mio taglio. Ottima professionalità e cura al dettaglio. In più è una persona accogliente che ti mette a tuo agio e offre sempre un caffè o qualcosa da bere."
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">PC</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Patrick Cali</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial 6 */}
                <div className="w-full flex-shrink-0 p-2">
                  <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-5xl text-[var(--accent)] opacity-20">"</div>
                      <p className="italic relative z-10 mb-6 text-[var(--text-primary)] text-opacity-80">
                        "Locale pulito, personale gentile e preparato. Sono sempre aggiornati sui tagli del momento, il signor Mario è davvero molto bravo!"
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">FD</div>
                      </div>
                      <div>
                        <h3 className="font-bold">Fabio De Santis</h3>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots navigation for testimonials */}
            <div className="flex justify-center mt-6 space-x-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeTestimonial === index
                      ? 'bg-[var(--accent)]'
                      : 'bg-gray-400 opacity-50'
                  }`}
                  aria-label={`Testimonianza ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section with Map Animation */}
      <section
        id="contact"
        ref={sectionRefs.contact}
        className={`py-20 px-4 bg-[var(--bg-secondary)] transition-all duration-1000 ${getAnimationClass('contact')}`}
      >
        {/* Existing contact section code... */}
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--accent)]">
            Dove Trovarci
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-12 text-[var(--text-primary)] opacity-80">
            Siamo facilmente raggiungibili nel centro di Lugano
          </p>

          <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <div className="bg-[var(--bg-secondary)] p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold mb-6 text-[var(--accent)]">Contatti</h3>

              <div className="space-y-6">
                {/* Indirizzo */}
                <div className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                  <div className="service-icon-wrapper">
                    <MapPin
                      className="icon-white"
                      style={{
                        color: 'white',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: 2.5
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Indirizzo</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">Via Zurigo 2, 6900 Lugano</p>
                  </div>
                </div>

                {/* Orari */}
                <div className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                  <div className="service-icon-wrapper">
                    <Clock
                      className="icon-white"
                      style={{
                        color: 'white',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: 2.5
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Orari</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">Lunedì: 14:00 - 19:00</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">Martedì - Sabato: 9:00 - 19:00</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">Domenica: Chiuso</p>
                  </div>
                </div>

                {/* Telefono */}
                <div className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                  <div className="service-icon-wrapper">
                    <Phone
                      className="icon-white"
                      style={{
                        color: 'white',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: 2.5
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Telefono</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">+41 78 930 15 99</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start transform hover:translate-x-1 transition-transform duration-300">
                  <div className="service-icon-wrapper">
                    <Mail
                      className="icon-white"
                      style={{
                        color: 'white',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: 2.5
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Email</p>
                    <p className="text-[var(--text-primary)] text-opacity-80">barbershopyourstyle@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to={user ? "/booking" : "/guest-booking"}
                  className="inline-block bg-[var(--accent)] text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all hover:shadow-lg transform hover:-translate-y-1"
                >
                  Prenota Ora
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            {/* Google Maps iframe with hover effect */}
            <div className="w-full h-96 rounded-lg shadow-lg overflow-hidden relative group">
              <div className="absolute inset-0 border-2 border-[var(--accent)] border-opacity-0 group-hover:border-opacity-50 rounded-lg transition-all duration-500 z-10"></div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2769.1762082072193!2d8.956452376757941!3d46.01143121224133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478433f211495255%3A0x2b7199e7a5d952f!2sYour%20Style%20Barber%20Shop!5e0!3m2!1sen!2sit!4v1709978855831!5m2!1sen!2sit"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Your Style Barber Shop Location"
                className="group-hover:opacity-90 transition-opacity"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Modern Footer with Animation */}
      <footer className="bg-[var(--bg-primary)] py-12 px-4 border-t border-[var(--accent)] border-opacity-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl font-bold text-[var(--accent)] hover:text-opacity-80 transition-colors duration-300">
                Your Style Barber Studio
              </h2>
              <p className="mt-2 text-[var(--text-primary)] opacity-80">Il tuo stile, la nostra passione</p>
            </div>

            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/yourstylelugano/?igsh=bzdocHJ5Y2dnbTJz#"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://wa.me/41789301599?text=Ciao!%20Vorrei%20richiedere%20un%27informazioni"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-[var(--accent)]">Menu rapido</h3>
              <div className="space-y-2">
              <button onClick={() => scrollToSection('services')} className="block hover:text-[var(--accent)] transition-colors">Servizi</button>
                <button onClick={() => scrollToSection('about')} className="block hover:text-[var(--accent)] transition-colors">Chi siamo</button>
                <button onClick={() => scrollToSection('video-gallery')} className="block hover:text-[var(--accent)] transition-colors">Visita Virtuale</button>
                <button onClick={() => scrollToSection('testimonials')} className="block hover:text-[var(--accent)] transition-colors">Recensioni</button>
                <button onClick={() => scrollToSection('contact')} className="block hover:text-[var(--accent)] transition-colors">Contatti</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 text-[var(--accent)]">Servizi</h3>
              <div className="space-y-2">
                <Link to={user ? "/booking" : "/guest-booking"} className="block hover:text-[var(--accent)] transition-colors">Taglio di Capelli</Link>
                <Link to={user ? "/booking" : "/guest-booking"} className="block hover:text-[var(--accent)] transition-colors">Barba</Link>
                <Link to={user ? "/booking" : "/guest-booking"} className="block hover:text-[var(--accent)] transition-colors">Taglio + Barba</Link>
                <Link to={user ? "/booking" : "/guest-booking"} className="block hover:text-[var(--accent)] transition-colors">Trattamenti Speciali</Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 text-[var(--accent)]">Orari di apertura</h3>
              <div className="space-y-2 text-[var(--text-primary)] opacity-80">
                <p>Lunedì: 14:00 - 19:00</p>
                <p>Martedì - Venerdì: 9:00 - 19:00</p>
                <p>Sabato: 9:00 - 19:00</p>
                <p>Domenica: Chiuso</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--text-primary)] border-opacity-10 pt-6 text-center">
          <p className="text-sm text-[var(--text-primary)] opacity-70">&copy; {new Date().getFullYear()} Your Style Barber Studio. Tutti i diritti riservati.</p>


          {/* Nuovo componente con pulsante principale e secondario */}
          <DCreativoPromoLink
            onClick={() => {
              setShowDCreativoPromo(!showDCreativoPromo); // Toggle per aprire/chiudere
              if (!showDCreativoPromo) { // Solo se stiamo aprendo
                setTimeout(() => {
                  scrollToDCreativoSection();
                }, 100);
              }
            }}
          />
        </div>
      </div>
    </footer>

  {/* DCreativo Footer Promo Section */}
  <style dangerouslySetInnerHTML={{ __html: dCreativoStyles }} />
    <div className={`transition-all duration-500 ${
      showDCreativoPromo
        ? 'opacity-100 max-h-[2000px]' // Usa max-height invece di height per supportare contenuti di dimensioni variabili
        : 'opacity-0 max-h-0 overflow-hidden'
      }`}>
      <DCreativoFooterPromo ref={handleDCreativoSectionRef} />
    </div>
  </div>
  );
});

export default HomePage;
