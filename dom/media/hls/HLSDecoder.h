/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef HLSDecoder_h_
#define HLSDecoder_h_

#include "HLSResource.h"
#include "MediaDecoder.h"

namespace mozilla {

class HLSDecoder final : public MediaDecoder
{
public:
  // MediaDecoder interface.
  explicit HLSDecoder(MediaDecoderInit& aInit)
    : MediaDecoder(aInit)
  {
  }

  void Shutdown() override;

  // Returns true if the HLS backend is pref'ed on.
  static bool IsEnabled();

  // Returns true if aContainerType is an HLS type that we think we can render
  // with the a platform decoder backend.
  // If provided, codecs are checked for support.
  static bool IsSupportedType(const MediaContainerType& aContainerType);

  nsresult Load(nsIChannel* aChannel);

  nsresult Play() override;

  void Pause() override;

  bool IsTransportSeekable() override { return true; }
  void Suspend() override;
  void Resume() override;

private:
  MediaResource* GetResource() const override final;

  MediaDecoderStateMachine* CreateStateMachine();

  bool CanPlayThroughImpl() override final
  {
    // TODO: We don't know how to estimate 'canplaythrough' for this decoder.
    // For now we just return true for 'autoplay' can work.
    return true;
  }

  bool IsLiveStream() override final { return false; }

  RefPtr<HLSResource> mResource;
};

} // namespace mozilla

#endif /* HLSDecoder_h_ */
