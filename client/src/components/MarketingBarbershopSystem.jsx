import { ArrowRight, BarChart2, Calendar, Check, Clock, DollarSign, Globe, Mail, Phone, ShieldCheck, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../config/api';
const MarketingBarbershopSystem = () => {
  const [activeTab, setActiveTab] = useState('features');
  const [activeFeature, setActiveFeature] = useState('booking');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    salonName: '',
    message: '',
    privacyAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const location = useLocation();

  // Scroll to top on component mount to ensure we start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Automatically update the activeTab based on URL hash if present
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['features', 'benefits', 'roi', 'testimonials', 'pricing'].includes(hash)) {
      setActiveTab(hash);

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isContactFormOpen) {
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          salonName: '',
          message: '',
          privacyAccepted: false
        });
        setSubmitStatus(null);
      }, 300);
    }
  }, [isContactFormOpen]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Funzione per gestire l'invio del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Usa l'istanza axios già configurata
      const response = await apiRequest.post('/contact', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        interest: 'booking-demo',
        message: `Nome salone: ${formData.salonName || 'Non specificato'}\n\n${formData.message}`
      });

      setSubmitStatus('success');
      // Chiudi form dopo un breve timeout in caso di successo
      setTimeout(() => {
        setIsContactFormOpen(false);
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Errore invio email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Array di funzionalità
  const features = [
    {
      id: 'booking',
      title: 'Sistema di Prenotazione Intelligente',
      description: 'Calcolo automatico degli slot disponibili basato sulla durata dei servizi, orari di lavoro e pause programmate.',
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 'notifications',
      title: 'Notifiche Automatiche',
      description: 'Invio automatico di conferme, promemoria e aggiornamenti via email, SMS e WhatsApp.',
      icon: <Clock className="w-6 h-6" />
    },
    {
      id: 'analytics',
      title: 'Statistiche e Analytics',
      description: 'Dashboard completa con metriche chiave e grafici per analizzare le performance del salone.',
      icon: <BarChart2 className="w-6 h-6" />
    },
    {
      id: 'management',
      title: 'Gestione Multi-livello',
      description: 'Pannelli dedicati per amministratori, barbieri e clienti con funzionalità specifiche.',
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 'security',
      title: 'Protezione dei Dati',
      description: 'Sistema sicuro con protezione dei dati personali in conformità con le normative sulla privacy.',
      icon: <ShieldCheck className="w-6 h-6" />
    }
  ];

  // Array di testimonial
  const testimonials = [
    {
      name: 'Santiago',
      role: 'Proprietario - Your Style Barber Studio',
      quote: '(Aggiungere recensione di Santiago',
      image: '/barber-testimonial-1.jpg'
    },

  ];

  // Calcolo ROI
  const roiData = [
    { label: 'Prenotazioni mensili', before: 132, after: 158, increase: '20%' },
    { label: 'Ricavo mensile (CHF)', before: 5280, after: 6320, increase: '20%' },
    { label: 'No-show', before: '15%', after: '3%', decrease: '80%' },
    { label: 'Tempo risparmiato (ore/mese)', before: 0, after: 20, value: '20h' }
  ];

  return (
    <div className="marketing-barbershop-system bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section id="hero" className="relative py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Sistema di Prenotazioni Online per Barber Shop
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Automatizza la gestione degli appuntamenti, riduci i no-show e aumenta i tuoi profitti.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsContactFormOpen(true)}
                  className="py-3 px-6 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Richiedi una Demo
                </button>
                <a
                  href="https://barbershop.dcreativo.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 bg-blue-500 bg-opacity-30 text-white font-bold rounded-lg border border-white border-opacity-30 hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Vedi Demo Live
                </a>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="rounded-lg shadow-2xl overflow-hidden border-4 border-white border-opacity-20">
                  <img
                    src="/shot-14.png"
                    alt="Sistema di Prenotazioni per Barber Shop"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg width='600' height='400' viewBox='0 0 600 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23718096'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='white'%3EPreview dell'applicazione%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg">
                  ROI in 3-5 mesi!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nav Tabs */}
      {/* Nav Tabs - Updated to include IDs for each tab */}
      <section id="nav-tabs" className="bg-white shadow">
        <div className="container mx-auto max-w-5xl">
          <div className="flex overflow-x-auto py-4 px-4">
            <button
              id="features"
              onClick={() => setActiveTab('features')}
              className={`py-2 px-4 font-medium rounded-lg mr-2 whitespace-nowrap ${activeTab === 'features' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Funzionalità
            </button>
            <button
              id="benefits"
              onClick={() => setActiveTab('benefits')}
              className={`py-2 px-4 font-medium rounded-lg mr-2 whitespace-nowrap ${activeTab === 'benefits' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Vantaggi
            </button>
            <button
              id="roi"
              onClick={() => setActiveTab('roi')}
              className={`py-2 px-4 font-medium rounded-lg mr-2 whitespace-nowrap ${activeTab === 'roi' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              ROI
            </button>
            <button
              id="pricing"
              onClick={() => setActiveTab('pricing')}
              className={`py-2 px-4 font-medium rounded-lg whitespace-nowrap ${activeTab === 'pricing' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Preventivo
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Each tab section remains the same but with proper ID attributes */}
          {activeTab === 'features' && (
            <div id="features-content" className="features-section animate-fade-in">

              <h2 className="text-3xl font-bold text-center mb-6">Funzionalità Principali</h2>
              <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
                Il nostro sistema di prenotazioni è stato progettato specificamente per barber shop e saloni, con funzionalità avanzate che ottimizzano la gestione degli appuntamenti.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature Navigation Sidebar */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Esplora le Funzionalità</h3>
                  <div className="space-y-2">
                    {features.map(feature => (
                      <button
                        key={feature.id}
                        onClick={() => setActiveFeature(feature.id)}
                        className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeFeature === feature.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                      >
                        <div className={`mr-3 ${activeFeature === feature.id ? 'text-white' : 'text-blue-600'}`}>
                          {feature.icon}
                        </div>
                        <span className="text-left">{feature.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature Content */}
                <div className="md:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
                  {features.map(feature => (
                    <div
                      key={feature.id}
                      className={`h-full transition-opacity duration-300 ${activeFeature === feature.id ? 'block opacity-100' : 'hidden opacity-0'}`}
                    >
                      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-6">
                        <div className="bg-white bg-opacity-20 rounded-full p-6">
                          <div className="text-white text-3xl">
                            {feature.icon}
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-bold mb-4 text-blue-600">{feature.title}</h3>
                        <p className="text-gray-700 mb-6">{feature.description}</p>

                        {/* Feature-specific content */}
                        {feature.id === 'booking' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Prenotazioni 24/7 senza intervento manuale</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Selezione barbiere, servizio, data e orario in pochi click</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Gestione intelligente degli slot disponibili</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Prenotazione come utente registrato o ospite</p>
                            </div>
                          </div>
                        )}

                        {feature.id === 'notifications' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Conferme istantanee via email</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Promemoria automatici 24 ore prima dell'appuntamento</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Notifiche via SMS e WhatsApp (opzionale)</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Avvisi per modifiche e cancellazioni</p>
                            </div>
                          </div>
                        )}

                        {feature.id === 'analytics' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Dashboard con metriche chiave del business</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Analisi dei servizi più richiesti</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Identificazione delle fasce orarie più popolari</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Report mensili e confronto con periodi precedenti</p>
                            </div>
                          </div>
                        )}

                        {feature.id === 'management' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Pannello amministratore per il controllo completo</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Pannello barbiere per gestire appuntamenti e orari</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Area cliente per prenotazioni e storico appuntamenti</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Gestione di servizi, prezzi e durate</p>
                            </div>
                          </div>
                        )}

                        {feature.id === 'security' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Sistema conforme al GDPR</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Backup automatici dei dati</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Accesso sicuro con autenticazione</p>
                            </div>
                            <div className="flex items-start">
                              <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                              <p>Hosting su server affidabili e sicuri</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-12">
                <button
                  onClick={() => setIsContactFormOpen(true)}
                  className="py-3 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Richiedi una Demo Personalizzata
                </button>
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className="benefits-section animate-fade-in">
              <h2 className="text-3xl font-bold text-center mb-12">Vantaggi per il Tuo Business</h2>
              <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
                Scopri come il nostro sistema di prenotazioni può trasformare il tuo barber shop, migliorando l'efficienza e aumentando i profitti.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {/* Growth Benefit */}
                <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">Crescita del Business</h3>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Incremento del 15-20% delle prenotazioni</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Ottimizzazione dell'agenda con più appuntamenti</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Riduzione dell'80% dei no-show</p>
                    </li>
                  </ul>
                </div>

                {/* Time Saving Benefit */}
                <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">Risparmio di Tempo</h3>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Riduzione del 70% delle chiamate telefoniche</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>5-10 ore settimanali risparmiate</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Nessuna interruzione durante i servizi</p>
                    </li>
                  </ul>
                </div>

                {/* Customer Experience Benefit */}
                <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">Esperienza Cliente</h3>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Prenotazione semplice da qualsiasi dispositivo</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Conferma immediata dell'appuntamento</p>
                    </li>
                    <li className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mt-1 mr-2 flex-shrink-0" />
                      <p>Promemoria utili per evitare dimenticanze</p>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center mt-8">
                <a
                  href="https://barbershop.dcreativo.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Prova la Demo Live
                </a>
              </div>
            </div>
          )}

          {/* ROI Tab */}
          {activeTab === 'roi' && (
            <div className="roi-section animate-fade-in">
              <h2 className="text-3xl font-bold text-center mb-12">Ritorno sull'Investimento</h2>
              <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
                Il nostro sistema di prenotazioni si ripaga in soli 3-5 mesi grazie all'incremento delle prenotazioni e alla riduzione dei costi.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* ROI Data Table */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-blue-600 text-white p-4">
                    <h3 className="text-xl font-bold">Analisi del ROI</h3>
                    <p className="text-sm text-blue-100">Esempio basato su un barbiere con 6 appuntamenti al giorno</p>
                  </div>
                  <div className="p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2">Metrica</th>
                          <th className="text-center py-2">Senza Sistema</th>
                          <th className="text-center py-2">Con Sistema</th>
                          <th className="text-center py-2">Differenza</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 font-medium">{item.label}</td>
                            <td className="py-3 text-center">{item.before}</td>
                            <td className="py-3 text-center text-blue-600 font-bold">{item.after}</td>
                            <td className="py-3 text-center text-green-600">
                              {item.increase ? `+${item.increase}` : ''}
                              {item.decrease ? `-${item.decrease}` : ''}
                              {item.value ? item.value : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="font-bold">Investimento iniziale: CHF 3,900</p>
                      <p className="text-sm text-gray-600 mt-1">Recupero stimato: 3-5 mesi</p>
                    </div>
                  </div>
                </div>

                {/* ROI Benefits */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Aumento delle Prenotazioni</h3>
                    <p className="mb-4">La possibilità per i clienti di prenotare 24/7 porta a un incremento del 15-20% delle prenotazioni, in particolare fuori orario di lavoro.</p>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span>+0%</span>
                      <span>+20%</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-600">Riduzione No-Show</h3>
                    <p className="mb-4">I promemoria automatici riducono i mancati appuntamenti dell'80%, ottimizzando il calendario e massimizzando i profitti.</p>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span>+0%</span>
                      <span>+80%</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-600">Risparmio di Tempo</h3>
                    <p className="mb-4">Risparmia 5-10 ore settimanali eliminando la gestione manuale degli appuntamenti, per concentrarti sul tuo lavoro.</p>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span>+0%</span>
                      <span>+60%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-10">
                <button
                  onClick={() => setIsContactFormOpen(true)}
                  className="py-3 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Richiedi un Preventivo Personalizzato
                </button>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="pricing-section animate-fade-in">
              <h2 className="text-3xl font-bold text-center mb-6">Investimento e Valore</h2>
              <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
                Un sistema di prenotazioni efficiente non è un costo, ma un investimento che si ripaga in pochi mesi.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                {/* Pricing Card */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-blue-600 p-6 text-white">
                    <h3 className="text-2xl font-bold">Soluzione Premium</h3>
                    <div className="flex items-end mt-4">
                      <span className="text-4xl font-bold">CHF 3,900</span>
                      <span className="text-blue-200 ml-2">una tantum</span>
                    </div>
                    <p className="text-blue-200 mt-2">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">Sconto 10%</span>
                      {' '}Prezzo scontato: CHF 3,510
                    </p>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4">Il pacchetto include:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Check className="text-green-500 w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Applicazione Web Completa</span>
                          <p className="text-sm text-gray-600">Frontend responsive, dashboard amministratore, portale barbieri, interfaccia cliente</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-green-500 w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Funzionalità Avanzate</span>
                          <p className="text-sm text-gray-600">Sistema di prenotazione automatizzato, gestione servizi, calendario dinamico, notifiche</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-green-500 w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Personalizzazione</span>
                          <p className="text-sm text-gray-600">Branding personalizzato, configurazione su misura, multilingua</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-green-500 w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Setup e Formazione</span>
                          <p className="text-sm text-gray-600">Configurazione con i tuoi dati, training per amministratori e staff</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Costi Ricorrenti */}
                <div className="flex flex-col">
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Costi Ricorrenti (Opzionali)</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div>
                          <span className="font-medium">Hosting su Vercel</span>
                          <p className="text-sm text-gray-600">Performance ottimizzate e alta disponibilità</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">CHF 240</span>
                          <p className="text-sm text-gray-600">annuale</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div>
                          <span className="font-medium">Dominio Personalizzato</span>
                          <p className="text-sm text-gray-600">Il tuo nome a scelta (es. tuosalone.ch)</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">CHF 15</span>
                          <p className="text-sm text-gray-600">annuale</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <div>
                          <span className="font-medium">Servizio SMS/WhatsApp</span>
                          <p className="text-sm text-gray-600">Per l'invio di notifiche via SMS e WhatsApp</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">CHF 25-50*</span>
                          <p className="text-sm text-gray-600">mensile</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Manutenzione e Supporto</span>
                          <p className="text-sm text-gray-600">Assistenza continua e aggiornamenti</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">CHF 100</span>
                          <p className="text-sm text-gray-600">mensile</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">*Dipende dal volume di notifiche</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-2">Tempistiche di Implementazione</h3>
                    <p className="text-sm mb-4">
                      Dalla firma del contratto alla messa online del sistema:
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Demo e Analisi</span>
                        <span className="font-medium">1 settimana</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Personalizzazione</span>
                        <span className="font-medium">1-2 settimane</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Implementazione</span>
                        <span className="font-medium">1 settimana</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Formazione</span>
                        <span className="font-medium">2-3 giorni</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Tempo totale</span>
                        <span>4-6 settimane</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setIsContactFormOpen(true)}
                  className="py-3 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Richiedi un Preventivo Personalizzato
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Contact Form Modal with animations and feedback */}
      {isContactFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="relative p-6">
              {/* Animated background decoration - pulse effect */}
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-blue-600 rounded-full opacity-10 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-16 h-16 bg-blue-400 rounded-full opacity-10 animate-pulse delay-300"></div>

              <div className="relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-blue-600">Richiedi una Demo</h3>
                  <button
                    onClick={() => setIsContactFormOpen(false)}
                    className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors duration-200"
                    aria-label="Chiudi"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                {/* Form content - conditional rendering based on submit status */}
                {submitStatus === 'success' ? (
                  <div className="py-10 px-6 text-center animate-fadeIn">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Richiesta inviata con successo!</h4>
                    <p className="text-gray-600 mb-6">
                      Grazie per il tuo interesse! Ti contatteremo al più presto per organizzare una demo personalizzata.
                    </p>
                    <p className="text-sm text-gray-500">
                      Controlla la tua email per una copia della richiesta.
                    </p>
                    <button
                      onClick={() => setIsContactFormOpen(false)}
                      className="mt-6 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Chiudi
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Nome e Cognome</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Inserisci il tuo nome"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="La tua email"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Telefono</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Il tuo numero di telefono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Nome del tuo salone</label>
                        <input
                          type="text"
                          name="salonName"
                          value={formData.salonName}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Nome del tuo Barber Shop"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Messaggio</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                          placeholder="Descrivi brevemente le tue esigenze o domande"
                          rows={4}
                        ></textarea>
                      </div>
                    </div>

                    {/* Status messages */}
                    {submitStatus === 'error' && (
                      <div className="p-3 bg-red-100 text-red-800 rounded-md animate-fadeIn flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>Si è verificato un errore durante l'invio. Riprova o contattaci direttamente via email o telefono.</p>
                      </div>
                    )}

                    <div className="flex items-start mt-4">
                      <input
                        type="checkbox"
                        id="privacy"
                        name="privacyAccepted"
                        checked={formData.privacyAccepted}
                        onChange={handleInputChange}
                        className="mt-1 mr-2"
                        required
                      />
                      <label htmlFor="privacy" className="text-sm text-gray-600">
                        Ho letto e accetto la <a href="#" className="text-blue-600 hover:underline">privacy policy</a>. I miei dati saranno trattati solo per rispondere alla mia richiesta.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-4 rounded-md font-bold transition-all duration-300 flex items-center justify-center ${
                        isSubmitting
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Richiedi Demo Gratuita
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="bg-gray-100 py-12 px-4 border-t border-gray-200">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl font-bold text-blue-600">DCreativo Solutions</h2>
              <p className="text-gray-600 mt-1">Sviluppo Web & App Personalizzati</p>
            </div>

            <div className="flex space-x-4">
              <a href="mailto:info@dcreativo.ch" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="w-6 h-6" />
              </a>
              <a href="tel:+41767810194" className="text-gray-600 hover:text-blue-600 transition-colors">
                <Phone className="w-6 h-6" />
              </a>
              <a
                href="https://www.dcreativo.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Globe className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} DCreativo Web & App Solutions. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};



export default MarketingBarbershopSystem;
