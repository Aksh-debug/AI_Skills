export function fixedChunk(doc,chunkSize=400,overlap=50){
    const chunks=[]
    let text=doc.text;
    let start=0;
    let index=0;
    while(start<text.length){
        const end = Math.min(start+chunkSize,text.length);
        const chunkText = text.slice(start,end).trim();
        if(chunkText.length>0){
            chunks.push(
                {
                    docId:doc.id,
                    topic:doc.topic,
                    chunkIndex:index++,
                    text:chunkText
                }
            )
        }
        if(end==text.length) break;
        start+=chunkSize-overlap
    }
    return chunks;
}


export function recursiveChunking(doc,maxSize=400){
    const chunks=[]
    let index=0;
    const paragraphs=doc.text.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);

    for(const para of paragraphs){
        if(para.length<=maxSize){
            chunks.push(
                {
                    docId:doc.id,
                    topic:doc.topic,
                    chunkIndex:index++,
                    text:para
                }
            )
            continue
        }
        const sentences=para.split(/(?<=[.!?])\s+/);
        let buffer=""
        for(const sentence of sentences){
            const candidate = buffer ? buffer + " " + sentence : sentence;
            if(candidate.length>=maxSize && buffer){
                chunks.push(
                    {
                        docId:doc.id,
                        topic:doc.topic,
                        chunkIndex:index++,
                        text:buffer.trim()
                    }
                )
                buffer=sentence
            }
            else{
                buffer=candidate
            }
        }
        if(buffer){
            chunks.push(
                {
                    docId:doc.id,
                    topic:doc.topic,
                    chunkIndex:index++,
                    text:buffer.trim()
                }
            )
        }
    }
    return chunks
}

export function semanticChunk(doc){
    const chunks=[]
    let index=0;
    const sections=doc.text.split(/\n(?=## )/).map(s=>s.trim()).filter(Boolean);
    
    for (const section of sections){
        chunks.push(
            {
                docId:doc.id,
                topic:doc.topic,
                chunkIndex:index++,
                text:section
            }
        )
    }
    return chunks
}


export function chunkAllDocs(docs,chunkerFn){
    let allChunks=[];
    for(const doc of docs){
        allChunks=allChunks.concat(chunkerFn(doc))
    }
    return allChunks;
}