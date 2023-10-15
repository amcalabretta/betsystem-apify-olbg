$('#tipsListingContainer-Match').find('.tip-row ').each((idx,row)=>{
    
    const k = $(row).find('.event-name').first().length;
    console.log(`${k}`);
})