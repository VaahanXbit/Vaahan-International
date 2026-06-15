// src/utils/fileHeader.js
export const fileHeader = (fileName, author, description) => {
  return `================================================================================
File Name : ${fileName}
Author : ${author}
Created Date : ${new Date().toISOString().split('T')[0]}
Description : ${description}
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
License : Proprietary and Confidential.
Unauthorized copying, modification, or distribution
of this file via any medium is strictly prohibited.
Modification History:
Date Author Version Description
${new Date().toISOString().split('T')[0]} ${author} 1.0.0 Initial creation.
================================================================================`
}