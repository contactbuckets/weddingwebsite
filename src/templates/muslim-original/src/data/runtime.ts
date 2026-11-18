import { weddingData, galleryItems } from './wedding';

export function configureWeddingData(data = {}) {
  const bride = String(data.bride || 'Bride');
  const groom = String(data.groom || 'Groom');
  const events = (Array.isArray(data.events) ? data.events : []).map((event, index) => {
    const date = String(event.date || data.date || '');
    const time = String(event.time || '18:00');
    const venue = String(event.venue || data.venue || '');
    const city = String(data.city || '');
    const query = [venue, city].filter(Boolean).join(', ');
    return {
      id: index === 0 ? 'nikah' : index === 1 ? 'valima' : String(event.name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: String(event.name || (index === 0 ? 'Mehfil-e-Nikah' : 'Dawat-e-Valima')),
      subTitle: index === 0 ? 'The Sacred Marriage Ceremony' : 'The Wedding Celebration',
      date: date ? new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '',
      dateISO: date,
      islamicDate: '',
      time,
      venue,
      address: '',
      city,
      state: '',
      country: 'India',
      mapsSearchUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query),
      badge: String(event.name || 'Wedding Celebration')
    };
  });
  const first = events[0] || { dateISO: data.date || '', time: '18:00' };
  const initials = value => value.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  Object.assign(weddingData, {
    bride: { fullName: bride, qualifications: '', shortName: bride.split(' ')[0] },
    groom: { fullName: groom, qualifications: '', shortName: groom.split(' ')[0] },
    monogram: initials(bride) + ' & ' + initials(groom),
    dateSummary: first.dateISO ? new Date(first.dateISO + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    islamicDateSummary: '',
    locationSummary: [data.venue, data.city].filter(Boolean).join(', '),
    targetDateTimeISO: (first.dateISO || '2027-01-01') + 'T' + (first.time || '18:00') + ':00+05:30',
    mainInvitationMessage: {
      heading: 'Wedding Invitation',
      invitationBy: String(data.welcome || 'Together with our families'),
      body: String(data.story || 'With the blessings of our families, we invite you to celebrate with us.'),
      eventInvite: 'Join us for our wedding celebrations.'
    },
    events,
    families: {
      bride: { side: 'bride', title: "Bride's Family", candidateName: bride, qualifications: '', relationshipTitle: '', fatherInfo: '', additionalInfo: '' },
      groom: { side: 'groom', title: "Groom's Family", candidateName: groom, qualifications: '', relationshipTitle: '', fatherInfo: '', additionalInfo: '' }
    },
    closing: {
      title: 'With Heartfelt Gratitude & Duas',
      duaArabic: 'بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
      duaTranslation: 'May Allah bless this union with goodness.',
      message: 'Thank you for being part of our celebration. Your presence and duas mean so much to our families.',
      compliments: 'With love and duas',
      sbtFamilyCompliments: ''
    },
    shareDetails: {
      title: bride + ' & ' + groom + ' — Wedding Invitation',
      messageText: bride + ' & ' + groom + ' invite you to celebrate their wedding.'
    }
  });
  galleryItems.splice(0, galleryItems.length, ...(Array.isArray(data.gallery) ? data.gallery : []).map((src, index) => ({
    id: 'guest-' + index, title: 'Wedding Memory', caption: 'A special moment from the couple.',
    src, alt: 'Wedding memory ' + (index + 1), tag: 'Gallery'
  })));
  weddingData.qrCode.imageSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(window.location.href);
}