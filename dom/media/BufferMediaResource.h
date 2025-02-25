/* vim:set ts=2 sw=2 sts=2 et cindent: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#if !defined(BufferMediaResource_h_)
#define BufferMediaResource_h_

#include "MediaResource.h"
#include "nsISeekableStream.h"
#include "nsIPrincipal.h"
#include <algorithm>

namespace mozilla {

// A simple MediaResource based on an in memory buffer.  This class accepts
// the address and the length of the buffer, and simulates a read/seek API
// on top of it.  The Read implementation involves copying memory, which is
// unfortunate, but the MediaResource interface mandates that.
class BufferMediaResource : public MediaResource
{
public:
  BufferMediaResource(const uint8_t* aBuffer,
                      uint32_t aLength,
                      nsIPrincipal* aPrincipal)
    : mBuffer(aBuffer)
    , mLength(aLength)
    , mOffset(0)
    , mPrincipal(aPrincipal)
  {
  }

protected:
  virtual ~BufferMediaResource()
  {
  }

private:
  // Get the current principal for the channel
  already_AddRefed<nsIPrincipal> GetCurrentPrincipal() override
  {
    nsCOMPtr<nsIPrincipal> principal = mPrincipal;
    return principal.forget();
  }
  // These methods are called off the main thread.
  nsresult ReadAt(int64_t aOffset, char* aBuffer,
                  uint32_t aCount, uint32_t* aBytes) override
  {
    if (aOffset < 0 || aOffset > mLength) {
      return NS_ERROR_FAILURE;
    }
    *aBytes = std::min(mLength - static_cast<uint32_t>(aOffset), aCount);
    memcpy(aBuffer, mBuffer + aOffset, *aBytes);
    mOffset = aOffset + *aBytes;
    return NS_OK;
  }
  // Memory-based and no locks, caching discouraged.
  bool ShouldCacheReads() override { return false; }

  int64_t Tell() override { return mOffset; }

  void Pin() override {}
  void Unpin() override {}
  int64_t GetLength() override { return mLength; }
  int64_t GetNextCachedData(int64_t aOffset) override { return aOffset; }
  int64_t GetCachedDataEnd(int64_t aOffset) override
  {
    return std::max(aOffset, int64_t(mLength));
  }
  bool IsDataCachedToEndOfResource(int64_t aOffset) override { return true; }
  nsresult ReadFromCache(char* aBuffer,
                         int64_t aOffset,
                         uint32_t aCount) override
  {
    if (aOffset < 0) {
      return NS_ERROR_FAILURE;
    }

    uint32_t bytes = std::min(mLength - static_cast<uint32_t>(aOffset), aCount);
    memcpy(aBuffer, mBuffer + aOffset, bytes);
    return NS_OK;
  }

  nsresult GetCachedRanges(MediaByteRangeSet& aRanges) override
  {
    aRanges += MediaByteRange(0, int64_t(mLength));
    return NS_OK;
  }

  size_t SizeOfExcludingThis(MallocSizeOf aMallocSizeOf) const override
  {
    // Not owned:
    // - mBuffer
    // - mPrincipal
    size_t size = MediaResource::SizeOfExcludingThis(aMallocSizeOf);
    return size;
  }

  size_t SizeOfIncludingThis(MallocSizeOf aMallocSizeOf) const override
  {
    return aMallocSizeOf(this) + SizeOfExcludingThis(aMallocSizeOf);
  }

private:
  const uint8_t * mBuffer;
  uint32_t mLength;
  uint32_t mOffset;
  nsCOMPtr<nsIPrincipal> mPrincipal;
};

} // namespace mozilla

#endif
