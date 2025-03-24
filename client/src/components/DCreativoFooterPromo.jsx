import { ArrowRight, Award, CheckCircle, Code, ExternalLink, Rocket, Zap } from 'lucide-react';
import React, { forwardRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../config/api';
// Enhanced DCreativo Footer Promo Component
const DCreativoFooterPromo = forwardRef((props, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'booking',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Reset form and status when modal opens/closes
  useEffect(() => {
    if (!isModalOpen) {
      // Reset after modal closes
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          interest: 'booking',
          message: ''
        });
        setSubmitStatus(null);
      }, 300);
    }
  }, [isModalOpen]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Usa l'istanza axios già configurata con i giusti headers e baseURL
      const response = await apiRequest.post('/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        interest: formData.interest,
        message: formData.message
      });

      setSubmitStatus('success');
      // Chiudi il modal dopo 3 secondi in caso di successo
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Errore invio email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation to marketing page with proper scroll
  const handleNavigateToMarketing = () => {
    // If we're already on the marketing page, just scroll to top
    if (location.pathname === '/marketing-barber-system') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Otherwise navigate and set a flag for scrolling
      navigate('/marketing-barber-system');
    }
  };

  // Effect to scroll to top when landing on the marketing page
  useEffect(() => {
    if (location.pathname === '/marketing-barber-system') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div ref={ref} className="dcreativo-footer-promo border-t border-[var(--accent)] border-opacity-20 py-8 px-4 bg-[var(--bg-secondary)]">
      <div className="container mx-auto max-w-6xl">
        {/* DCreativo Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-8 border-b border-[var(--text-primary)] border-opacity-10">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <div
                className="w-12 h-12 mr-3 rounded-full overflow-hidden flex items-center justify-center bg-gray-900 p-0.5"
                style={{
                  background: "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)",
                }}
              >
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img
                    src="/dcreativo-logo.png"
                    alt="DCreativo Logo"
                    className="w-[90%] h-[90%] object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23222'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='40' text-anchor='middle' fill='%2300CCFF'%3ED%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-[var(--accent)] to-purple-400">
                DCreativo Solutions
              </h3>
            </div>
            <p className="text-[var(--text-primary)] opacity-80 max-w-md">
              Trasformiamo le tue idee in applicazioni web professionali, offrendo soluzioni personalizzate per la tua attività.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative overflow-hidden bg-[var(--accent)] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center"
            >
              <span className="relative z-10 flex items-center">
                <Rocket className="w-5 h-5 mr-2" />
                Richiedi Informazioni
              </span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
            </button>
          </div>
        </div>

        {/* Enhanced call-to-action */}
        <div className="mt-8 mb-12">
          <button
            onClick={handleNavigateToMarketing}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center mx-auto"
            style={{
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.7)',
            }}
          >
            <span className="relative z-10 flex items-center">
              <Zap className="w-6 h-6 mr-3" />
              <span className="text-xl">Scopri il sistema di prenotazioni</span>
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
            <span className="absolute inset-0 border-2 border-blue-300 rounded-lg animate-pulse-subtle"></span>
          </button>
        </div>

        {/* Services Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="service-card group p-4 rounded-lg bg-[var(--bg-primary)] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-3">
              <div className="service-icon-wrapper mr-3">
                <Code className="icon-white w-5 h-5" />
              </div>
              <h4 className="font-bold">Sviluppo Web</h4>
            </div>
            <p className="text-sm text-[var(--text-primary)] text-opacity-80">
              Siti web responsive e applicazioni ottimizzate per tutte le piattaforme.
            </p>
          </div>

          <div className="service-card group p-4 rounded-lg bg-[var(--bg-primary)] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-3">
              <div className="service-icon-wrapper mr-3">
                <Zap className="icon-white w-5 h-5" />
              </div>
              <h4 className="font-bold">Sistemi di Prenotazione</h4>
            </div>
            <p className="text-sm text-[var(--text-primary)] text-opacity-80">
              Soluzioni avanzate per la gestione degli appuntamenti per il tuo business.
            </p>
          </div>

          <div className="service-card group p-4 rounded-lg bg-[var(--bg-primary)] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-3">
              <div className="service-icon-wrapper mr-3">
                <Award className="icon-white w-5 h-5" />
              </div>
              <h4 className="font-bold">Design Personalizzato</h4>
            </div>
            <p className="text-sm text-[var(--text-primary)] text-opacity-80">
              Interfacce intuitive e accattivanti su misura per il tuo brand.
            </p>
          </div>

          <div className="service-card group p-4 rounded-lg bg-[var(--bg-primary)] hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-3">
              <div className="service-icon-wrapper mr-3">
                <CheckCircle className="icon-white w-5 h-5" />
              </div>
              <h4 className="font-bold">Supporto Continuo</h4>
            </div>
            <p className="text-sm text-[var(--text-primary)] text-opacity-80">
              Assistenza tecnica e aggiornamenti per mantenere la tua applicazione sempre efficiente.
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center">
          <p className="text-[var(--text-primary)] opacity-80 mb-4">
            Vuoi saperne di più sui nostri servizi di sviluppo web?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="mailto:info@dcreativo.ch" className="flex items-center hover:text-[var(--accent)] transition-colors">
              <span>info@dcreativo.ch</span>
            </a>
            <span className="hidden sm:block text-[var(--text-primary)] opacity-40">|</span>
            <a href="tel:+41767810194" className="flex items-center hover:text-[var(--accent)] transition-colors">
              <span>+41 76 781 01 94</span>
            </a>
            <span className="hidden sm:block text-[var(--text-primary)] opacity-40">|</span>
            <a
              href="https://www.dcreativo.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-[var(--accent)] transition-colors"
            >
              <span>www.dcreativo.ch</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <a
              href="https://barbershop.dcreativo.ch/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[var(--accent)] hover:underline text-sm flex items-center font-medium"
            >
              <span>Vedi la demo del sistema di prenotazioni</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
            <span className="hidden sm:block text-[var(--text-primary)] opacity-40">|</span>
            <button
              onClick={handleNavigateToMarketing}
              className="inline-block text-[var(--accent)] hover:underline text-sm flex items-center font-medium"
            >
              <span>Scopri tutti i vantaggi del sistema</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* Info Request Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[var(--accent)]">Richiedi Informazioni</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome e Cognome</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-[var(--bg-secondary)]"
                      placeholder="Inserisci il tuo nome"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-[var(--bg-secondary)]"
                      placeholder="La tua email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Telefono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-[var(--bg-secondary)]"
                      placeholder="Il tuo numero di telefono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sono interessato a</label>
                    <select
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-[var(--bg-secondary)]"
                    >
                      <option value="booking">Sistema di Prenotazioni</option>
                      <option value="website">Sito Web</option>
                      <option value="webapp">Applicazione Web</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Messaggio</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-[var(--bg-secondary)] min-h-20"
                      placeholder="Descrivi brevemente le tue esigenze"
                      required
                    ></textarea>
                  </div>

                  {/* Status messages */}
                  {submitStatus === 'success' && (
                    <div className="p-3 bg-green-100 text-green-800 rounded-md">
                      <p className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Richiesta inviata con successo! Ti contatteremo al più presto.
                      </p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-3 bg-red-100 text-red-800 rounded-md">
                      <p>Si è verificato un errore. Riprova o contattaci direttamente via email.</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[var(--accent)] text-white font-bold py-2 px-4 rounded-md transition-all ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'
                    }`}
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
                  </button>
                </form>

                <p className="mt-4 text-xs text-[var(--text-primary)] opacity-60 text-center">
                  I tuoi dati saranno trattati nel rispetto della privacy e utilizzati solo per rispondere alla tua richiesta.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default DCreativoFooterPromo;
