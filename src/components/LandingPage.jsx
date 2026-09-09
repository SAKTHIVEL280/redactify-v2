import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  UploadCloud, ShieldAlert, ShieldCheck, BadgeCheck, Scale, Landmark, 
  Activity, UserCheck, WifiOff, FileText, CheckCircle2, Zap, ArrowRight, 
  ChevronDown, ChevronUp, Lock, Sparkles, Check, HelpCircle, EyeOff, 
  Layers, Download, ServerOff, FileCheck, ExternalLink, AlertCircle,
  RotateCw, Crosshair
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useRedactionStore } from '../store/redactionStore';
import { useLicenseStore } from '../store/licenseStore';
import { PRESETS } from '../core/engine/presets';
import { parseAndScanPDF } from '../core/parsers/pdfParser';
import { parseAndExtractDOCX } from '../core/parsers/docxParser';
import { detectEntities } from '../core/engine/detector';
import { createSampleOfferLetterPdf } from '../core/parsers/samplePdfGenerator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};


const FAQS = [
  {
    q: "How can I verify that my documents are never uploaded to any server?",
    a: "You can test this in 10 seconds. Open your browser Developer Tools (press F12 or right-click and choose Inspect), click the Network tab, and drop your document. You will see exactly 0 HTTP requests. You can also turn off your Wi-Fi or unplug your internet: Redactify will continue to redact and export your documents at full speed because the entire engine runs inside your browser."
  },
  {
    q: "Can someone remove the black boxes in exported PDFs to see the hidden text?",
    a: "No. Superficial tools only place a black visual shape over the text, which means anyone can copy the text underneath. Redactify completely deletes the underlying letters and words from the PDF vector file. In addition, all hidden file metadata (author name, revision history, and creation dates) is scrubbed clean."
  },
  {
    q: "Does Redactify comply with privacy laws like GDPR and HIPAA?",
    a: "Yes. Because your files never leave your computer, no sensitive data crosses international borders or gets stored on cloud servers. This complies with GDPR Article 32, HIPAA Safe Harbor de-identification rules, and strict corporate data retention policies."
  },
  {
    q: "How does Redactify handle phone photos and scanned IDs?",
    a: "If your document is a camera photo or scanned image without searchable text, Redactify includes built-in offline OCR that reads the text directly on your device. You can rotate sideways phone photos with one click and use the manual crosshair tool to black out signatures, stamps, and ID card photos."
  },
  {
    q: "Can I use Redactify offline without an internet connection?",
    a: "Yes. Once the page is loaded, Redactify is 100% self-contained. All text processing models and OCR files are stored locally in your browser. It runs seamlessly on air-gapped computers."
  }
];

export function LandingPage({ onNavigateToStudio, onNavigateToPricing }) {
  const pageRef = useRef(null);
  const heroCardRef = useRef(null);
  const [activeSection, setActiveSection] = useState('01 / ZERO-TRUST');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Precision 3D Card Tilt Physics
  const handleHeroMouseMove = useCallback((e) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotY = (x / (rect.width / 2)) * 3.5;
    const rotX = -(y / (rect.height / 2)) * 3.5;

    gsap.to(heroCardRef.current, {
      rotateX: rotX,
      rotateY: rotY,
      transformPerspective: 1200,
      duration: 0.35,
      ease: 'power2.out',
    });
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    if (!heroCardRef.current) return;
    gsap.to(heroCardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.65,
      ease: 'power3.out',
    });
  }, []);

  // GSAP ScrollTrigger and Orchestrated Transitions
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const scroller = document.getElementById('landing-scroll-container') || window;

    const ctx = gsap.context(() => {
      // 1. Overall scroll progress tracker
      ScrollTrigger.create({
        scroller,
        trigger: pageRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });

      // 2. Active section tracking for floating pill
      const sections = [
        { id: 'hero-section', label: '01 / ZERO-TRUST' },
        { id: 'features-section', label: '02 / ENGINES' },
        { id: 'metrics-section', label: '03 / BENCHMARKS' },
        { id: 'deep-dive-01', label: '04 / AIR-GAP' },
        { id: 'deep-dive-02', label: '05 / DETECTION' },
        { id: 'deep-dive-03', label: '06 / ROTATION' },
        { id: 'comparison-section', label: '07 / AUDIT' },
        { id: 'faq-section', label: '08 / FAQ' },
      ];

      sections.forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (el) {
          ScrollTrigger.create({
            scroller,
            trigger: el,
            start: 'top 45%',
            end: 'bottom 45%',
            onEnter: () => setActiveSection(label),
            onEnterBack: () => setActiveSection(label),
          });
        }
      });

      // 3. Hero Entry Timeline (Guaranteed Visibility with clearProps)
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .fromTo('.gsap-hero-kicker', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)' })
        .fromTo('.gsap-hero-title', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, '-=0.4')
        .fromTo('.gsap-hero-sub', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, '-=0.5')
        .fromTo('.gsap-hero-cta', { scale: 0.95, y: 15, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(
          '.gsap-hero-card',
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            clearProps: 'opacity,transform',
          },
          '-=0.4'
        );

      // 4. Parallax effect on vector images inside deep dive cards
      const parallaxImages = gsap.utils.toArray('.gsap-parallax-img');
      parallaxImages.forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: 'none',
            scrollTrigger: {
              scroller,
              trigger: img.closest('.gsap-parallax-container') || img,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          }
        );
      });

      // 5. Section Divider Hairlines Drawing (Bidirectional)
      const dividers = gsap.utils.toArray('.gsap-draw-line');
      dividers.forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            transformOrigin: 'center center',
            duration: 0.9,
            ease: 'power3.inOut',
            scrollTrigger: {
              scroller,
              trigger: line,
              start: 'top 92%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      });

      // 6. Feature Cards Stagger & Depth Reveal (Bidirectional)
      const featureCards = gsap.utils.toArray('.gsap-feature-card');
      if (featureCards.length > 0) {
        gsap.fromTo(
          featureCards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              scroller,
              trigger: '#features-section',
              start: 'top 85%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      }

      // 7. Live Scrubbed / Bidirectional Metric Counters
      const metricsContainer = document.getElementById('metrics-section');
      if (metricsContainer) {
        const metricBoxes = gsap.utils.toArray('.gsap-metric-box');
        if (metricBoxes.length > 0) {
          gsap.fromTo(
            metricBoxes,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: {
                scroller,
                trigger: metricsContainer,
                start: 'top 85%',
                toggleActions: 'play reverse play reverse',
              },
            }
          );
        }

        const metricEl15 = document.getElementById('gsap-metric-15ms');
        const metricEl100 = document.getElementById('gsap-metric-100pct');
        const metricEl17 = document.getElementById('gsap-metric-17plus');

        const animateMetrics = () => {
          if (metricEl15) {
            const count15 = { val: 0 };
            gsap.to(count15, {
              val: 15,
              duration: 1.3,
              ease: 'power2.out',
              onUpdate: () => {
                metricEl15.innerText = `< ${Math.round(count15.val)}ms`;
              },
            });
          }
          if (metricEl100) {
            const count100 = { val: 0 };
            gsap.to(count100, {
              val: 100,
              duration: 1.5,
              ease: 'power2.out',
              onUpdate: () => {
                metricEl100.innerText = `${Math.round(count100.val)}%`;
              },
            });
          }
          if (metricEl17) {
            const count17 = { val: 0 };
            gsap.to(count17, {
              val: 17,
              duration: 1.3,
              ease: 'power2.out',
              onUpdate: () => {
                metricEl17.innerText = `${Math.round(count17.val)}+`;
              },
            });
          }
        };

        ScrollTrigger.create({
          scroller,
          trigger: metricsContainer,
          start: 'top 85%',
          onEnter: animateMetrics,
          onEnterBack: animateMetrics,
        });
      }

      // 8. Deep Dive Sections Text & Card Entrances (Bidirectional)
      ['#deep-dive-01', '#deep-dive-02', '#deep-dive-03'].forEach((id, idx) => {
        const section = document.querySelector(id);
        if (section) {
          const textCol = section.querySelector('.gsap-deep-text');
          const cardCol = section.querySelector('.gsap-deep-card');

          if (textCol) {
            gsap.fromTo(
              textCol,
              { x: idx % 2 === 0 ? -40 : 40, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                  scroller,
                  trigger: section,
                  start: 'top 82%',
                  toggleActions: 'play reverse play reverse',
                },
              }
            );
          }
          if (cardCol) {
            gsap.fromTo(
              cardCol,
              { x: idx % 2 === 0 ? 40 : -40, opacity: 0, scale: 0.96 },
              {
                x: 0,
                opacity: 1,
                scale: 1,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: {
                  scroller,
                  trigger: section,
                  start: 'top 82%',
                  toggleActions: 'play reverse play reverse',
                },
              }
            );
          }
        }
      });

      // 9. Comparison Section Orchestration (Keynote-grade Bidirectional)
      const compSection = document.getElementById('comparison-section');
      if (compSection) {
        gsap.fromTo(
          '.gsap-comp-header',
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              scroller,
              trigger: compSection,
              start: 'top 85%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );

        gsap.fromTo(
          '#comparison-table-card',
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              scroller,
              trigger: compSection,
              start: 'top 82%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );

        const compRows = gsap.utils.toArray('.gsap-comp-row');
        if (compRows.length > 0) {
          gsap.fromTo(
            compRows,
            { y: 18, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.07,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                scroller,
                trigger: '#comparison-table-card',
                start: 'top 85%',
                toggleActions: 'play reverse play reverse',
              },
            }
          );
        }
      }

      // 10. FAQ Section Orchestration (Reliable Immediate Trigger & Bidirectional)
      const faqSection = document.getElementById('faq-section');
      if (faqSection) {
        gsap.fromTo(
          '.gsap-faq-header',
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              scroller,
              trigger: faqSection,
              start: 'top 95%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );

        const faqItems = gsap.utils.toArray('.gsap-faq-item');
        if (faqItems.length > 0) {
          gsap.fromTo(
            faqItems,
            { y: 25, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.07,
              duration: 0.65,
              ease: 'power3.out',
              scrollTrigger: {
                scroller,
                trigger: faqSection,
                start: 'top 95%',
                toggleActions: 'play reverse play reverse',
              },
            }
          );
        }
      }

      // Recalculate triggers after microtasks settle
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);


  const setFile = useDocumentStore((s) => s.setFile);
  const setDocumentData = useDocumentStore((s) => s.setDocumentData);
  const setProgress = useDocumentStore((s) => s.setProgress);
  const isProcessing = useDocumentStore((s) => s.isProcessing);
  const progress = useDocumentStore((s) => s.progress);
  const error = useDocumentStore((s) => s.error);
  const setError = useDocumentStore((s) => s.setError);

  const activePreset = useRedactionStore((s) => s.activePreset);
  const setRedactions = useRedactionStore((s) => s.setRedactions);
  const customRules = useRedactionStore((s) => s.customRules);

  // Universal File Processor
  const processFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);

    const name = file.name.toLowerCase();
    let fileType = 'text';

    if (name.endsWith('.pdf')) fileType = 'pdf';
    else if (name.endsWith('.docx')) fileType = 'docx';
    else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) fileType = 'image';
    else if (name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.log')) fileType = 'text';
    else {
      setError('Unsupported file type. Please upload a PDF, DOCX, TXT, or Image file.');
      return;
    }

    setFile(file, fileType);
    if (onNavigateToStudio) onNavigateToStudio();
    setProgress(0, 100, 'Reading document on your device...');

    try {
      if (fileType === 'pdf') {
        const result = await parseAndScanPDF(file, activePreset, customRules, (curr, total, msg) => {
          setProgress(curr, total, msg);
        });

        setDocumentData({
          pageCount: result.numPages,
          isScannedDocument: result.isScannedDocument
        });

        setRedactions(result.redactions);
        if (result.isScannedDocument || result.redactions.length === 0) {
          useRedactionStore.getState().setDrawingMode(true);
        }
      } else if (fileType === 'docx') {
        setProgress(30, 100, 'Opening Word document in memory...');
        const { rawText } = await parseAndExtractDOCX(file);
        setProgress(60, 100, 'Scanning text for sensitive details...');
        const detections = detectEntities(rawText, activePreset, customRules);

        const redactions = detections.map((det, i) => ({
          id: `box_docx_${det.id}_${i}`,
          pageIndex: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'auto',
          category: det.category,
          entityType: det.type,
          value: det.value,
          suggested: det.suggested,
          confidence: det.confidence,
          redact: true
        }));

        setDocumentData({
          rawText,
          pageCount: 1
        });
        setRedactions(redactions);
      } else if (fileType === 'text') {
        const text = await file.text();
        setProgress(50, 100, 'Scanning text for sensitive details...');
        const detections = detectEntities(text, activePreset, customRules);
        
        const redactions = detections.map((det, i) => ({
          id: `box_txt_${det.id}_${i}`,
          pageIndex: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'auto',
          category: det.category,
          entityType: det.type,
          value: det.value,
          suggested: det.suggested,
          confidence: det.confidence,
          redact: true
        }));

        setDocumentData({
          rawText: text,
          pageCount: 1
        });
        setRedactions(redactions);
      } else if (fileType === 'image') {
        setDocumentData({
          pageCount: 1,
          isScannedDocument: true
        });
        useRedactionStore.getState().setDrawingMode(true);
        setRedactions([]);
      }

      setProgress(100, 100, 'Ready');
    } catch (err) {
      console.error('File parsing error:', err);
      setError(`Failed to open document: ${err.message || 'Unknown format'}`);
    }
  }, [activePreset, customRules, onNavigateToStudio, setDocumentData, setError, setFile, setProgress, setRedactions]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const loadSampleOfferLetter = async () => {
    try {
      const file = await createSampleOfferLetterPdf();
      processFile(file);
    } catch (err) {
      console.error('Failed to load sample PDF:', err);
    }
  };


  return (
    <div ref={pageRef} className="relative flex flex-col min-h-screen bg-warm-bone text-charcoal">
      
      {/* Top Edge GSAP Scroll Progress Hairline */}
      <div 
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-700 via-charcoal to-amber-800 z-50 origin-left transition-transform duration-75 pointer-events-none"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* Editorial Floating Section Pill */}
      <div className="fixed bottom-5 right-5 z-40 hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-paper-white/95 backdrop-blur-md border border-stone-mist shadow-card text-charcoal font-mono text-[11px] select-none pointer-events-none transition-opacity duration-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
        <span className="font-semibold">{activeSection}</span>
        <span className="text-stone-mist">|</span>
        <span className="text-bark-grey">{Math.round(scrollProgress * 100)}%</span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION WITH GSAP ORCHESTRATION & 3D PERSPECTIVE
      ────────────────────────────────────────────────────────────── */}
      <section 
        id="hero-section"
        className="pt-8 sm:pt-14 pb-8 sm:pb-12 px-3.5 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center"
      >
        
        {/* Editorial Category Kicker */}
        <div className="gsap-hero-kicker font-mono text-[11px] sm:text-xs uppercase tracking-widest text-bark-grey font-semibold mb-3 sm:mb-4">
          Private In-Memory Document Sanitization
        </div>

        {/* Display Headline in Cooper LtBT serif */}
        <h1 className="gsap-hero-title font-serif text-[32px] sm:text-[54px] md:text-[66px] lg:text-[76px] leading-[1.14] sm:leading-[1.08] text-charcoal font-normal max-w-4xl tracking-normal mb-4 sm:mb-6">
          Document redaction for <em>teams</em> who <br className="hidden sm:inline" />
          care about <span className="text-amber-800 italic">privacy</span>
        </h1>

        {/* Human, approachable subtext */}
        <p className="gsap-hero-sub text-bark-grey text-sm sm:text-lg md:text-xl max-w-2xl leading-relaxed font-sans mb-6 sm:mb-8 px-1 sm:px-0">
          Permanently remove confidential names, IDs, credit cards, and banking numbers from PDFs, Word documents, and scans. <span className="text-charcoal font-semibold">Zero files ever leave your device: runs 100% locally on your computer.</span>
        </p>

        {/* CTA Pair with responsive touch-friendly targets */}
        <div className="gsap-hero-cta flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full sm:w-auto max-w-xs sm:max-w-none">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={loadSampleOfferLetter}
            className="cursor-pointer font-semibold font-mono uppercase border text-xs sm:text-sm rounded-button px-5 py-3 sm:py-2.5 bg-paper-white border-stone-mist hover:bg-stone-mist/40 text-charcoal shadow-sm transition-colors text-center"
          >
            Try Sample File
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNavigateToStudio}
            className="cursor-pointer font-semibold font-mono uppercase border text-xs sm:text-sm rounded-button px-6 py-3 sm:py-2.5 text-white bg-charcoal border-charcoal hover:bg-black shadow-sm transition-colors flex items-center justify-center gap-2 tracking-wider"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            UNIFIED HERO WORKSPACE: INTEGRATED DROPZONE + 3D TILT CARD
        ────────────────────────────────────────────────────────────── */}
        <div 
          ref={heroCardRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`gsap-hero-card relative w-full max-w-4xl bg-paper-white rounded-card border transition-colors duration-200 shadow-showcase mb-10 sm:mb-14 text-left overflow-hidden ${
            isDragging
              ? 'border-charcoal ring-4 ring-charcoal/10 bg-soft-cream'
              : 'border-stone-mist'
          }`}
        >
          {/* Active Drag-and-Drop High-Contrast Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-30 bg-paper-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 rounded-card bg-charcoal text-white flex items-center justify-center mb-4 shadow-lg animate-bounce">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif text-charcoal">Release to redact immediately</h3>
                <p className="text-xs font-mono text-bark-grey mt-1 max-w-sm">
                  Processed 100% in local browser volatile memory. Zero network uploads.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Integrated Dropzone Area */}
          <div className="p-4 sm:p-6 md:p-8 bg-warm-bone/40 border-b border-stone-mist relative">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.csv,.log,.png,.jpg,.jpeg,.webp"
              onChange={handleFileInput}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Click or drop a document to redact"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-charcoal border-t-transparent animate-spin mb-3" />
                <div className="text-xs font-mono uppercase font-semibold text-charcoal mb-1">
                  {progress.message || 'Processing document on your device...'}
                </div>
                <div className="text-[11px] text-bark-grey font-mono">
                  {progress.total > 0 ? `${progress.current} / ${progress.total}` : 'Parsing client-side'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-button bg-paper-white border border-stone-mist flex items-center justify-center text-charcoal shadow-sm shrink-0 mt-0.5">
                    <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold text-charcoal">
                      Drop your PDF, Word, or image file here
                    </h3>
                    <p className="text-xs text-bark-grey mt-0.5 font-sans">
                      Everything is processed directly inside your browser memory. <span className="text-charcoal font-semibold underline underline-offset-4">Browse files on device</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-bark-grey font-mono uppercase">
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">PDF</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">DOCX</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">PNG / JPG</span>
                      <span className="px-2 py-0.5 rounded-tag bg-paper-white border border-stone-mist">TXT</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={loadSampleOfferLetter}
                    className="relative z-20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-button bg-paper-white hover:bg-stone-mist/50 text-charcoal border border-stone-mist text-xs font-mono font-medium shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-charcoal" />
                    <span>Try Sample PDF</span>
                  </motion.button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-tag bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Studio Document Redaction Preview Showcase */}
          <div className="relative border-t border-stone-mist bg-paper-white group">
            {/* Editorial Studio Canvas Header Bar */}
            <div className="px-3.5 sm:px-6 py-2 sm:py-2.5 bg-warm-bone/60 border-b border-stone-mist flex items-center justify-between text-[11px] sm:text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-semibold text-charcoal tracking-wide">REDACTION STUDIO PREVIEW</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-bark-grey text-[10px] sm:text-[11px]">
                <span className="hidden xs:inline sm:inline">VOLATILE RAM BUFFER</span>
                <span className="hidden xs:inline sm:inline text-stone-mist">•</span>
                <span className="text-charcoal font-semibold">0 BYTES TRANSMITTED</span>
              </div>
            </div>

            {/* Vector Illustration Container with centered containment */}
            <div className="relative w-full h-[220px] xs:h-[260px] sm:h-[360px] md:h-[440px] overflow-hidden bg-[#FAF8F5] flex items-center justify-center p-2 sm:p-6">
              <img
                src="/images/studio-preview-vector.jpg"
                alt="Redactify document redaction studio preview"
                className="w-full h-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                onLoad={() => ScrollTrigger.refresh()}
              />
              <div className="absolute inset-0 pointer-events-none border-t border-black/5" />
            </div>
          </div>
        </div>

      </section>

      {/* GSAP Architectural Drawing Hairline */}
      <div className="gsap-draw-line max-w-6xl mx-auto w-full h-px bg-stone-mist mb-16" />

      {/* ─────────────────────────────────────────────────────────────
          2. 3-COLUMN FEATURE CARDS GRID WITH GSAP STAGGER & DEPTH
      ────────────────────────────────────────────────────────────── */}
      <section id="features-section" className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-16">
        <div className="border-x border-stone-mist">
          <ul className="grid grid-cols-1 sm:grid-cols-3 sm:border-b border-t border-stone-mist">
            {/* Card 1 */}
            <li className="gsap-feature-card group flex flex-col border-b border-stone-mist sm:border-b-0 sm:border-r border-stone-mist hover:bg-warm-bone/40 transition-colors">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white group-hover:bg-transparent transition-colors">
                <p className="text-charcoal font-medium text-base font-mono">PDF Vector Scrubbing</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Permanently deletes underlying text glyphs and metadata streams. Black boxes cannot be copied, selected, or inspected.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Zero Text Leaks</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal group-hover:translate-x-1 transition-transform" />
              </div>
            </li>

            {/* Card 2 */}
            <li className="gsap-feature-card group flex flex-col border-b border-stone-mist sm:border-b-0 sm:border-r border-stone-mist hover:bg-warm-bone/40 transition-colors">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white group-hover:bg-transparent transition-colors">
                <p className="text-charcoal font-medium text-base font-mono">Word Documents (.docx)</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Cleans sensitive names and banking numbers across tables, paragraphs, and headers while keeping your exact layout intact.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Layout Preserved</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal group-hover:translate-x-1 transition-transform" />
              </div>
            </li>

            {/* Card 3 */}
            <li className="gsap-feature-card group flex flex-col border-stone-mist hover:bg-warm-bone/40 transition-colors">
              <div className="flex flex-col gap-2 p-6 flex-1 bg-paper-white group-hover:bg-transparent transition-colors">
                <p className="text-charcoal font-medium text-base font-mono">ID Cards & Scans (OCR)</p>
                <p className="text-bark-grey font-normal text-sm leading-relaxed">
                  Built-in offline OCR detects text on photos. Easily rotate sideways phone photos 90° and draw manual blackout rectangles.
                </p>
              </div>
              <div className="border-t border-stone-mist px-6 py-3 bg-warm-bone flex items-center justify-between">
                <span className="text-charcoal font-medium text-xs font-mono uppercase">Rotate & Draw</span>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal group-hover:translate-x-1 transition-transform" />
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* GSAP Architectural Drawing Hairline */}
      <div className="gsap-draw-line max-w-6xl mx-auto w-full h-px bg-stone-mist mb-16" />

      {/* ─────────────────────────────────────────────────────────────
          3. METRICS BAR WITH LIVE GSAP ANIMATED COUNTERS
      ────────────────────────────────────────────────────────────── */}
      <section id="metrics-section" className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="border-x border-stone-mist">
          <div className="border-t border-b border-stone-mist">
            {/* 4 Metric Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div className="gsap-metric-box flex flex-col justify-center gap-1.5 p-3.5 sm:p-6 border-stone-mist odd:border-r md:odd:border-r-0 md:border-r bg-paper-white">
                <p className="text-amber-800 font-bold text-2xl sm:text-4xl font-datatype text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping inline-block" />
                  <span>0</span>
                </p>
                <p className="text-charcoal font-semibold text-[11px] sm:text-xs text-center">Bytes uploaded to any server</p>
              </div>
              <div className="gsap-metric-box flex flex-col justify-center gap-1.5 p-3.5 sm:p-6 border-stone-mist md:border-r bg-paper-white">
                <p id="gsap-metric-15ms" className="text-charcoal font-bold text-2xl sm:text-4xl font-datatype text-center">&lt; 15ms</p>
                <p className="text-bark-grey font-medium text-[11px] sm:text-xs text-center">Instant detection speed</p>
              </div>
              <div className="gsap-metric-box flex flex-col justify-center gap-1.5 p-3.5 sm:p-6 border-stone-mist odd:border-r md:odd:border-r-0 md:border-r bg-paper-white">
                <p id="gsap-metric-100pct" className="text-amber-800 font-bold text-2xl sm:text-4xl font-datatype text-center">100%</p>
                <p className="text-charcoal font-semibold text-[11px] sm:text-xs text-center">Client-side offline processing</p>
              </div>
              <div className="gsap-metric-box flex flex-col justify-center gap-1.5 p-3.5 sm:p-6 border-stone-mist bg-paper-white">
                <p id="gsap-metric-17plus" className="text-charcoal font-bold text-2xl sm:text-4xl font-datatype text-center">17+</p>
                <p className="text-bark-grey font-medium text-[11px] sm:text-xs text-center">Standard PII types recognized</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* GSAP Architectural Drawing Hairline */}
      <div className="gsap-draw-line max-w-6xl mx-auto w-full h-px bg-stone-mist mb-20" />

      {/* ─────────────────────────────────────────────────────────────
          4. NUMBERED DEEP-DIVE SECTIONS (#01, #02, #03) WITH GSAP PARALLAX
      ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20">
        <div className="flex flex-col border-x border-t border-stone-mist">
          
          {/* #01 - Zero Cloud Exposure with Vector Illustration */}
          <div id="deep-dive-01" className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              <div className="gsap-deep-text flex flex-col gap-3">
                <p className="text-amber-800 font-mono text-xs font-bold uppercase tracking-wider">
                  #01: Zero Cloud Exposure
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Your private files <span className="text-amber-800">never leave your computer</span>.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Most online redaction websites upload your contracts, tax returns, and client IDs to remote cloud servers. If their server is ever compromised, your sensitive files are exposed.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Redactify works completely inside your web browser using WebAssembly. Disconnect your internet connection, turn off Wi-Fi, and see for yourself: Redactify continues to work flawlessly.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span className="font-semibold">0 HTTP Network Requests Sent</span>
                  </span>
                </div>
              </div>

              {/* Pure Vector Illustration Showcase with GSAP Parallax */}
              <div className="gsap-deep-card gsap-parallax-container relative rounded-card border border-stone-mist overflow-hidden bg-warm-bone/20 shadow-showcase group w-full aspect-[4/3] sm:aspect-[16/10] min-h-[260px] sm:min-h-[340px]">
                <img
                  src="/images/airgap-vault-vector.jpg"
                  alt="Air-gap vault security and client-side isolation"
                  className="gsap-parallax-img w-full h-full object-cover scale-[1.06] transition-transform duration-500 ease-out group-hover:scale-[1.09]"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>
            </div>
          </div>

          {/* #02 - Smart Automatic Detection with Vector Illustration */}
          <div id="deep-dive-02" className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              {/* Pure Vector Illustration Showcase with GSAP Parallax */}
              <div className="order-2 md:order-1 gsap-deep-card gsap-parallax-container relative rounded-card border border-stone-mist overflow-hidden bg-warm-bone/20 shadow-showcase group w-full aspect-[4/3] sm:aspect-[16/10] min-h-[260px] sm:min-h-[340px]">
                <img
                  src="/images/pattern-detection-vector.jpg"
                  alt="Automated pattern detection and document sanitization"
                  className="gsap-parallax-img w-full h-full object-cover scale-[1.06] transition-transform duration-500 ease-out group-hover:scale-[1.09]"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>

              <div className="order-1 md:order-2 gsap-deep-text flex flex-col gap-3">
                <p className="text-amber-800 font-mono text-xs font-bold uppercase tracking-wider">
                  #02: Smart Pattern Detection
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Automatically spots sensitive data <span className="text-amber-800">before you hit send</span>.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Forget searching through dozens of pages by hand. Redactify automatically detects Social Security Numbers, Tax IDs, IBANs, bank accounts, emails, phone numbers, and compensation details.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Built-in mathematical checksums verify digits instantly, ensuring actual sensitive numbers are scrubbed without flagging harmless order IDs or dates.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal shadow-xs">
                    US & Global IDs
                  </span>
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal shadow-xs">
                    Healthcare HIPAA
                  </span>
                  <span className="px-2.5 py-1 rounded-tag bg-paper-white border border-stone-mist text-xs font-mono text-charcoal shadow-xs">
                    Banking & Payroll
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* #03 - Scanned Documents & Photos with Vector Illustration */}
          <div id="deep-dive-03" className="border-b border-stone-mist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10 items-center">
              <div className="gsap-deep-text flex flex-col gap-3">
                <p className="text-charcoal font-mono text-xs font-bold uppercase tracking-wider">
                  #03: Scans & Phone Photos
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal leading-tight">
                  Fix sideways phone photos and <span className="text-charcoal font-bold">black out signatures</span>.
                </h2>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Took a photo of an ID card, contract, or receipt on your mobile phone that saved vertically instead of horizontally? Rotate it 90 degrees with one click.
                </p>
                <p className="text-bark-grey text-sm md:text-base leading-relaxed font-sans">
                  Use the manual crosshair tool to draw custom blackout rectangles over handwritten signatures, official rubber stamps, or ID portrait photos. Everything burns directly into the image upon download.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <button 
                    onClick={onNavigateToStudio}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-button bg-paper-white border border-stone-mist text-xs font-mono uppercase font-semibold text-charcoal hover:bg-stone-mist/40 transition-colors shadow-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-charcoal" />
                    <span>Rotate 90° Controls</span>
                  </button>
                  <button 
                    onClick={onNavigateToStudio}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-button bg-paper-white border border-stone-mist text-xs font-mono uppercase font-semibold text-charcoal hover:bg-stone-mist/40 transition-colors shadow-xs"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-charcoal" />
                    <span>Manual Crosshair</span>
                  </button>
                </div>
              </div>

              {/* Pure Vector Illustration Showcase with GSAP Parallax */}
              <div className="gsap-deep-card gsap-parallax-container relative rounded-card border border-stone-mist overflow-hidden bg-warm-bone/20 shadow-showcase group w-full aspect-[4/3] sm:aspect-[16/10] min-h-[260px] sm:min-h-[340px]">
                <img
                  src="/images/rotation-blackout-vector.jpg"
                  alt="Document orientation rotation and signature blackout"
                  className="gsap-parallax-img w-full h-full object-cover scale-[1.06] transition-transform duration-500 ease-out group-hover:scale-[1.09]"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* GSAP Architectural Drawing Hairline */}
      <div className="gsap-draw-line max-w-6xl mx-auto w-full h-px bg-stone-mist mb-20" />

      {/* ─────────────────────────────────────────────────────────────
          5. COMPARISON TABLE WITH GSAP CASCADE
      ────────────────────────────────────────────────────────────── */}
      <section 
        id="comparison-section"
        className="max-w-6xl mx-auto w-full px-4 md:px-6 mb-20 overflow-hidden"
      >
        <div className="gsap-comp-header text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.10em] text-bark-grey mb-2">
            Comparison
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal">
            Why teams choose Redactify
          </h2>
          <p className="mt-2 text-sm text-bark-grey font-sans">
            How client-side redaction compares to Adobe Acrobat and typical web tools.
          </p>
        </div>

        <div id="comparison-table-card" className="border border-stone-mist rounded-card overflow-hidden bg-paper-white shadow-card">
          <div className="sm:hidden px-4 py-2 bg-warm-bone/60 border-b border-stone-mist text-[11px] font-mono text-bark-grey flex items-center justify-between">
            <span>Swipe horizontally to compare</span>
            <span>→</span>
          </div>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-stone-mist bg-warm-bone text-xs font-mono text-charcoal">
                  <th className="py-4 px-6 font-semibold w-1/3">Feature / Security Invariant</th>
                  <th className="py-4 px-6 font-bold text-charcoal bg-amber-500/10 border-x border-stone-mist w-1/3">
                    <div className="flex items-center justify-between">
                      <span>Redactify V2</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-700 text-white font-semibold tracking-wider">
                        Client-Side
                      </span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-bark-grey font-medium w-1/6">Adobe Acrobat Pro</th>
                  <th className="py-4 px-6 text-bark-grey font-medium w-1/6">Typical Web Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-mist text-xs sm:text-sm font-sans text-charcoal">
                <tr className="gsap-comp-row transition-colors hover:bg-warm-bone/40">
                  <td className="py-4 px-6 font-medium">Where files are processed</td>
                  <td className="py-4 px-6 font-semibold bg-amber-50/40 border-x border-stone-mist text-amber-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% On Device (RAM)</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Adobe Document Cloud</td>
                  <td className="py-4 px-6 text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Remote Cloud Servers</span>
                    </div>
                  </td>
                </tr>
                <tr className="gsap-comp-row transition-colors hover:bg-warm-bone/40">
                  <td className="py-4 px-6 font-medium">Offline and air-gapped support</td>
                  <td className="py-4 px-6 font-semibold bg-amber-50/40 border-x border-stone-mist text-charcoal">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Yes (Fully offline capable)</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Requires cloud license checks</td>
                  <td className="py-4 px-6 text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Fails without internet</span>
                    </div>
                  </td>
                </tr>
                <tr className="gsap-comp-row transition-colors hover:bg-warm-bone/40">
                  <td className="py-4 px-6 font-medium">Permanent vector text deletion</td>
                  <td className="py-4 px-6 font-semibold bg-amber-50/40 border-x border-stone-mist text-charcoal">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Yes (Glyphs fully destroyed)</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Yes (Sanitize document)</td>
                  <td className="py-4 px-6 text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Superficial black boxes</span>
                    </div>
                  </td>
                </tr>
                <tr className="gsap-comp-row transition-colors hover:bg-warm-bone/40">
                  <td className="py-4 px-6 font-medium">Sideways photo 90° rotation</td>
                  <td className="py-4 px-6 font-semibold bg-amber-50/40 border-x border-stone-mist text-charcoal">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Yes (One-click CW & CCW)</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-bark-grey">Requires page organize tool</td>
                  <td className="py-4 px-6 text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Not supported</span>
                    </div>
                  </td>
                </tr>
                <tr className="gsap-comp-row transition-colors hover:bg-warm-bone/40">
                  <td className="py-4 px-6 font-medium">Pricing model</td>
                  <td className="py-4 px-6 font-semibold bg-amber-50/40 border-x border-stone-mist text-charcoal">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>$9 / mo or $29 Early-Bird Lifetime</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-bark-grey">$240+ / year subscription</td>
                  <td className="py-4 px-6 text-bark-grey">$60 - $120 / year subscription</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* GSAP Architectural Drawing Hairline */}
      <div className="gsap-draw-line max-w-4xl mx-auto w-full h-px bg-stone-mist mb-20" />

      {/* ─────────────────────────────────────────────────────────────
          6. FAQ ACCORDION WITH GSAP STAGGER
      ────────────────────────────────────────────────────────────── */}
      <section 
        id="faq-section"
        className="max-w-4xl mx-auto w-full px-4 md:px-6 mb-28"
      >
        <div className="gsap-faq-header text-center mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.10em] text-bark-grey mb-2">
            Clear Answers
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-normal">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="gsap-faq-item rounded-card border border-stone-mist bg-paper-white overflow-hidden shadow-card transition-all hover:border-charcoal/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-sans font-medium text-sm sm:text-base text-charcoal hover:text-black transition-colors"
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-bark-grey" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-bark-grey leading-relaxed border-t border-stone-mist pt-3 font-sans">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. AUTOSEND 4-COLUMN FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-mist bg-paper-white py-12 px-4 md:px-6 text-xs text-bark-grey">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="flex items-center gap-2">
              {/* Bespoke Document Redaction Glyph */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-charcoal">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="7" y="12" width="10" height="2.5" rx="1" fill="currentColor" />
                <rect x="7" y="16.5" width="6" height="2" rx="0.8" fill="currentColor" opacity="0.6" />
              </svg>
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-charcoal">Redactify</span>
            </div>
            <p className="text-xs text-bark-grey leading-relaxed">
              Zero-knowledge, client-side document redaction running 100% inside your browser. No files uploaded.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Product</span>
              <button onClick={onNavigateToStudio} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Studio
              </button>
              <button onClick={loadSampleOfferLetter} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Sample Document
              </button>
              <button onClick={onNavigateToPricing} className="text-left text-bark-grey hover:text-charcoal transition-colors">
                Pricing
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Privacy</span>
              <span className="text-bark-grey">GDPR Article 32</span>
              <span className="text-bark-grey">HIPAA Safe Harbor</span>
              <span className="text-bark-grey">Zero Server Logs</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono uppercase font-semibold text-charcoal text-xs">Security</span>
              <span className="text-bark-grey">Air-Gapped Operation</span>
              <span className="text-bark-grey">Client-Side WASM</span>
              <span className="text-bark-grey">Zero Network Egress</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-stone-mist flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-bark-grey">
          <span>© {new Date().getFullYear()} Redactify. Documents are processed exclusively on your device.</span>
          <span className="font-mono">v2.0 • 100% Client-Side Privacy</span>
        </div>
      </footer>
    </div>
  );
}
