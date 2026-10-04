/*
 * BrandedQR Chrome Extension - Clean Version
 * Professional QR Code Generator for Chrome Sidebar
 */

// Get DOM elements
const textInput = document.getElementById('textInput');
const resultsContainer = document.getElementById('resultsContainer');
const qrCodeContainer = document.getElementById('qrcode');
const downloadLink = document.getElementById('downloadLink');
const detectionInfo = document.getElementById('detectionInfo');

// Flow elements
const inputSection = document.querySelector('.input-section');
const logoUploadContainer = document.getElementById('logoUploadContainer');
const uploadArea = document.getElementById('uploadArea');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');
const previewImage = document.getElementById('previewImage');
const removeLogo = document.getElementById('removeLogo');
const continueBtn = document.getElementById('continueBtn');
const skipLogoBtn = document.getElementById('skipLogoBtn');
const createQRBtn = document.getElementById('createQRBtn');
const currentLogo = document.getElementById('currentLogo');
const currentLogoImg = document.getElementById('currentLogoImg');
const changeLogoBtn = document.getElementById('changeLogoBtn');

// Generation elements
const generationContainer = document.getElementById('generationContainer');
const qrGrid = document.getElementById('qrGrid');
const qrOverlay = document.getElementById('qrOverlay');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// Global variables
let currentLogoFile = null;
const LOGO_STORAGE_KEY = 'brandedqr_logo';

// Chrome extension storage functions
function saveLogoToStorage(dataURL) {
    try {
        chrome.storage.local.set({ [LOGO_STORAGE_KEY]: dataURL });
    } catch (e) {
        console.warn('Could not save logo to storage:', e);
    }
}

function loadLogoFromStorage() {
    return new Promise((resolve) => {
        try {
            chrome.storage.local.get([LOGO_STORAGE_KEY], (result) => {
                resolve(result[LOGO_STORAGE_KEY] || null);
            });
        } catch (e) {
            console.warn('Could not load logo from storage:', e);
            resolve(null);
        }
    });
}

function removeLogoFromStorage() {
    try {
        chrome.storage.local.remove([LOGO_STORAGE_KEY]);
    } catch (e) {
        console.warn('Could not remove logo from storage:', e);
    }
}

// Navigation functions
function showInputSection() {
    console.log('Showing input section');
    document.querySelectorAll('.logo-upload-container, .input-section, .generation-container, .results-container').forEach(el => {
        el.style.display = 'none';
    });
    
    if (inputSection) {
        inputSection.style.display = 'block';
        if (textInput) textInput.focus();
    }
}

function showLogoUploadSection() {
    console.log('Showing logo upload section');
    document.querySelectorAll('.logo-upload-container, .input-section, .generation-container, .results-container').forEach(el => {
        el.style.display = 'none';
    });
    
    if (logoUploadContainer) {
        logoUploadContainer.style.display = 'block';
    }
}

// Smart QR Code Type Detection and Formatting
function detectAndFormatInput(input) {
    input = input.trim();
    
    // URL Detection
    if (/^https?:\/\//i.test(input) || /^www\./i.test(input)) {
        showDetectionInfo('🌐 URL detected - Creating clickable web link');
        return input.startsWith('www.') ? `https://${input}` : input;
    }
    
    // Email Detection
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
        showDetectionInfo('📧 Email detected - Creating mailto link');
        return `mailto:${input}`;
    }
    
    // Phone Number Detection
    if (/^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/.test(input.replace(/\s/g, ''))) {
        const cleanPhone = input.replace(/\D/g, '');
        showDetectionInfo('📞 Phone number detected - Creating dial link');
        return `tel:${cleanPhone}`;
    }
    
    // WiFi Detection
    if (/^WIFI:/i.test(input)) {
        showDetectionInfo('📶 WiFi detected - Creating network connection');
        return input.toUpperCase();
    }
    
    // vCard Detection
    if (/^BEGIN:VCARD/i.test(input)) {
        showDetectionInfo('👤 Contact card detected - Creating vCard');
        return input;
    }
    
    // Location Detection
    if (/^geo:/i.test(input)) {
        showDetectionInfo('📍 Location detected - Creating map link');
        return input;
    }
    
    // Domain without protocol
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/.test(input) && !input.includes(' ')) {
        showDetectionInfo('🌐 Website detected - Adding HTTPS protocol');
        return `https://${input}`;
    }
    
    // Default: plain text
    showDetectionInfo('📝 Plain text detected - Creating text QR code');
    return input;
}

function showDetectionInfo(message) {
    if (detectionInfo) {
        detectionInfo.textContent = message;
        detectionInfo.style.display = 'block';
    }
}

// Logo upload functions
function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const dataURL = e.target.result;
        
        // Save to storage
        saveLogoToStorage(dataURL);
        
        // Update UI
        previewImage.src = dataURL;
        logoPreview.style.display = 'block';
        uploadArea.style.display = 'none';
        continueBtn.style.display = 'block';
        
        // Convert data URL back to file for QR generation
        currentLogoFile = dataURLToFile(dataURL, file.name || 'logo.png');
    };
    
    reader.readAsDataURL(file);
}

function dataURLToFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

async function loadCachedLogo() {
    const cachedLogo = await loadLogoFromStorage();
    if (cachedLogo) {
        previewImage.src = cachedLogo;
        currentLogoImg.src = cachedLogo;
        currentLogo.style.display = 'flex';
        currentLogoFile = dataURLToFile(cachedLogo, 'cached-logo.png');
        showInputSection();
        return true;
    }
    return false;
}

// Animated QR Generation Function
function startAnimatedQRGeneration(inputText) {
    console.log('Starting animated QR generation...');
    
    // Simple transition for sidebar - no sliding animations
    inputSection.style.display = 'none';
    generationContainer.style.display = 'block';
    
    // Hide header during generation
    const container = document.querySelector('.sidebar-container');
    container.classList.add('hide-header');
    
    // Show generation screen immediately
    generationContainer.classList.add('active');
    
    // Start the generation animation with a short delay
    setTimeout(() => {
        animateQRGeneration(inputText);
    }, 200);
}

function animateQRGeneration(inputText) {
    console.log('Animating QR generation process...');
    
    // Create fake QR grid animation
    createQRGridAnimation();
    
    // Progress stages
    const stages = [
        { progress: 15, text: 'Analyzing input data...', duration: 500 },
        { progress: 30, text: 'Detecting content type...', duration: 400 },
        { progress: 50, text: 'Generating QR matrix...', duration: 500 },
        { progress: 70, text: 'Applying error correction...', duration: 400 },
        { progress: 85, text: 'Adding logo overlay...', duration: 400 },
        { progress: 100, text: 'Finalizing QR code...', duration: 300 }
    ];
    
    let currentStage = 0;
    
    function nextStage() {
        if (currentStage < stages.length) {
            const stage = stages[currentStage];
            progressBar.style.width = stage.progress + '%';
            progressText.textContent = stage.text;
            
            currentStage++;
            setTimeout(nextStage, stage.duration);
        } else {
            completeQRGeneration(inputText);
        }
    }
    
    nextStage();
    
    // Fallback: if generation takes too long, show results anyway
    setTimeout(() => {
        if (resultsContainer.style.display === 'none') {
            console.log('Generation taking too long, showing results directly');
            generateBrandedQR(inputText);
            showResults();
        }
    }, 5000);
}

function createQRGridAnimation() {
    qrGrid.innerHTML = '';
    
    for (let i = 0; i < 400; i++) { // 20x20 grid for sidebar
        const pixel = document.createElement('div');
        pixel.className = 'qr-pixel';
        
        if (Math.random() > 0.5) {
            pixel.style.animationDelay = `${Math.random() * 1.5}s`;
            qrGrid.appendChild(pixel);
        } else {
            pixel.style.background = 'transparent';
            qrGrid.appendChild(pixel);
        }
    }
    
    qrGrid.style.opacity = '1';
}

function completeQRGeneration(inputText) {
    console.log('Completing QR generation...');
    
    // Generate QR immediately for sidebar
    generateBrandedQR(inputText);
    
    // Quick morph transition
    setTimeout(() => {
        morphToRealQR();
    }, 500);
}

function morphToRealQR() {
    console.log('Morphing to real QR...');
    
    const realQRContainer = document.createElement('div');
    realQRContainer.className = 'real-qr-morph';
    realQRContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 180px;
        height: 180px;
        opacity: 0;
        border-radius: 8px;
        overflow: hidden;
    `;
    
    const qrImage = qrCodeContainer.querySelector('img');
    if (qrImage) {
        const clonedQR = qrImage.cloneNode(true);
        clonedQR.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
        realQRContainer.appendChild(clonedQR);
    }
    
    const qrProgress = document.getElementById('qrGenerationProgress');
    qrProgress.appendChild(realQRContainer);
    
    // Fade transitions
    qrGrid.style.transition = 'opacity 0.6s ease';
    qrOverlay.style.transition = 'opacity 0.6s ease';
    realQRContainer.style.transition = 'opacity 0.6s ease';
    
    qrGrid.style.opacity = '0';
    qrOverlay.style.opacity = '0';
    realQRContainer.style.opacity = '1';
    
    setTimeout(() => {
        showResults();
    }, 300);
}

function showResults() {
    console.log('Showing results...');
    
    // Simple transition for sidebar
    generationContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    const container = document.querySelector('.sidebar-container');
    container.classList.add('hide-header');
    
    // Activate results immediately
    resultsContainer.classList.add('active');
    console.log('Results container activated');
}

// QR Code Generation
function createQRCode() {
    const inputText = textInput.value.trim();
    
    if (!inputText) {
        textInput.focus();
        return;
    }
    
    const formattedText = detectAndFormatInput(inputText);
    startAnimatedQRGeneration(formattedText);
}

function generateBrandedQR(inputText) {
    qrCodeContainer.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    qrCodeContainer.appendChild(canvas);
    
    // Generate QR code with highest error correction
    const qr = new QRious({
        element: canvas,
        value: inputText,
        size: 180, // Smaller for sidebar
        level: 'H'
    });
    
    // Create center quiet zone
    const ctx = canvas.getContext('2d');
    createCenterQuietZone(ctx);
    
    // Convert to image
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(img);
    
    setTimeout(() => {
        if (currentLogoFile) {
            overlayLogoOnQR();
        } else {
            finishQRGeneration();
        }
    }, 100);
}

function createCenterQuietZone(ctx) {
    const qrSize = 180;
    const squareSize = Math.floor(qrSize * 0.2);
    const squareX = Math.floor((qrSize - squareSize) / 2);
    const squareY = Math.floor((qrSize - squareSize) / 2);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(squareX, squareY, squareSize, squareSize);
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
}

function overlayLogoOnQR() {
    const qrImage = qrCodeContainer.querySelector('img');
    if (!qrImage || !currentLogoFile) {
        finishQRGeneration();
        return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 180;
    canvas.height = 180;
    
    ctx.drawImage(qrImage, 0, 0, 180, 180);
    
    const logoImg = new Image();
    logoImg.onload = function() {
        const qrSize = 180;
        const squareSize = Math.floor(qrSize * 0.2);
        const squareX = Math.floor((qrSize - squareSize) / 2);
        const squareY = Math.floor((qrSize - squareSize) / 2);
        
        const logoAspectRatio = logoImg.width / logoImg.height;
        let logoWidth, logoHeight;
        
        const maxLogoSize = squareSize * 0.9;
        
        if (logoAspectRatio > 1) {
            logoWidth = maxLogoSize;
            logoHeight = maxLogoSize / logoAspectRatio;
        } else {
            logoHeight = maxLogoSize;
            logoWidth = maxLogoSize * logoAspectRatio;
        }
        
        const logoX = squareX + (squareSize - logoWidth) / 2;
        const logoY = squareY + (squareSize - logoHeight) / 2;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(squareX, squareY, squareSize, squareSize);
        
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        
        const brandedQRDataURL = canvas.toDataURL('image/png');
        qrImage.src = brandedQRDataURL;
        
        finishQRGeneration();
    };
    
    logoImg.src = previewImage.src;
}

function finishQRGeneration() {
    const qrImage = qrCodeContainer.querySelector('img');
    if (qrImage && qrImage.src) {
        downloadLink.href = qrImage.src;
        downloadLink.download = `brandedqr-${Date.now()}.png`;
    }
}

// Event listeners
continueBtn.addEventListener('click', showInputSection);
skipLogoBtn.addEventListener('click', () => {
    currentLogoFile = null;
    showInputSection();
});

createQRBtn.addEventListener('click', createQRCode);

changeLogoBtn.addEventListener('click', () => {
    removeLogoFromStorage();
    currentLogoFile = null;
    currentLogo.style.display = 'none';
    showLogoUploadSection();
});

uploadArea.addEventListener('click', () => logoInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

logoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

removeLogo.addEventListener('click', () => {
    removeLogoFromStorage();
    currentLogoFile = null;
    previewImage.src = '';
    logoPreview.style.display = 'none';
    uploadArea.style.display = 'block';
    continueBtn.style.display = 'none';
    logoInput.value = '';
});

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createQRCode();
    }
});

downloadLink.addEventListener('click', (e) => {
    console.log('Download initiated');
});

// Initialize app
async function initializeApp() {
    console.log('Initializing BrandedQR extension');
    
    // Hide all sections first
    document.querySelectorAll('.logo-upload-container, .input-section, .generation-container, .results-container').forEach(el => {
        el.style.display = 'none';
    });
    
    // Try to load cached logo
    if (await loadCachedLogo()) {
        console.log('Cached logo found, showing input section');
        showInputSection();
    } else {
        console.log('No cached logo, showing logo upload section');
        showLogoUploadSection();
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}