#import <Cocoa/Cocoa.h>
#import <QuartzCore/QuartzCore.h>

/// Apple does not expose the standard window corner radius; values follow recent macOS trends.
static CGFloat PatchlinePreferredWindowCornerRadius(void) {
	NSOperatingSystemVersion v = [[NSProcessInfo processInfo] operatingSystemVersion];
	const NSInteger major = v.majorVersion;
	if (major >= 16) {
		return 18.0;
	}
	if (major >= 15) {
		return 16.0;
	}
	if (major >= 14) {
		return 14.0;
	}
	if (major >= 13) {
		return 13.0;
	}
	if (major >= 12) {
		return 12.0;
	}
	return 10.0;
}

static NSString *const kPatchlineNativeChromeEffectId = @"PatchlineNativeChromeEffect";

static NSVisualEffectView *findPatchlineNativeChromeEffectView(NSView *contentView) {
	for (NSView *subview in [contentView subviews]) {
		if ([subview isKindOfClass:[NSVisualEffectView class]] &&
		    [[subview identifier] isEqualToString:kPatchlineNativeChromeEffectId]) {
			return (NSVisualEffectView *)subview;
		}
	}
	return nil;
}

/// Full-window vibrancy behind the WebKit view (`NSVisualEffectMaterialUnderWindowBackground`).
extern "C" bool patchline_enable_window_vibrancy(void *windowPtr) {
	if (windowPtr == nullptr) {
		return false;
	}

	__block BOOL success = NO;
	dispatch_sync(dispatch_get_main_queue(), ^{
		NSWindow *window = (__bridge NSWindow *)windowPtr;
		if (![window isKindOfClass:[NSWindow class]]) {
			return;
		}

		[window setOpaque:NO];
		[window setBackgroundColor:[NSColor clearColor]];
		[window setTitlebarAppearsTransparent:YES];
		[window setHasShadow:YES];

		NSView *contentView = [window contentView];
		if (contentView == nil) {
			return;
		}

		NSVisualEffectView *effectView = findPatchlineNativeChromeEffectView(contentView);
		if (effectView == nil) {
			effectView = [[NSVisualEffectView alloc] initWithFrame:[contentView bounds]];
			[effectView setIdentifier:kPatchlineNativeChromeEffectId];
			[effectView
			    setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];

			NSView *relativeView = [[contentView subviews] firstObject];
			if (relativeView != nil) {
				[contentView addSubview:effectView
					    positioned:NSWindowBelow
					    relativeTo:relativeView];
			} else {
				[contentView addSubview:effectView];
			}
		}

		[effectView setFrame:[contentView bounds]];
		if (@available(macOS 10.14, *)) {
			[effectView setMaterial:NSVisualEffectMaterialUnderWindowBackground];
		} else {
			[effectView setMaterial:NSVisualEffectMaterialSidebar];
		}
		[effectView setBlendingMode:NSVisualEffectBlendingModeBehindWindow];
		[effectView setState:NSVisualEffectStateActive];
		[effectView setHidden:NO];

		[window invalidateShadow];
		success = YES;
	});

	return success;
}

/// Rounds the window client area to match contemporary macOS window chrome.
/// Pass `radius` < 0 to use a version-based default; 0 to disable (square).
extern "C" bool patchline_set_window_corner_radius(void *windowPtr, double radius) {
	if (windowPtr == nullptr) {
		return false;
	}

	__block BOOL success = NO;
	dispatch_sync(dispatch_get_main_queue(), ^{
		NSWindow *window = (__bridge NSWindow *)windowPtr;
		if (![window isKindOfClass:[NSWindow class]]) {
			return;
		}

		NSView *contentView = [window contentView];
		if (contentView == nil) {
			return;
		}

		CGFloat r = 0.0;
		if (radius < 0.0) {
			r = PatchlinePreferredWindowCornerRadius();
		} else {
			r = (CGFloat)radius;
		}

		[contentView setWantsLayer:YES];
		CALayer *layer = [contentView layer];
		if (layer == nil) {
			return;
		}

		if (r < 0.5) {
			[layer setCornerRadius:0.0];
			[layer setMasksToBounds:NO];
			if (@available(macOS 11.0, *)) {
				[layer setCornerCurve:kCACornerCurveCircular];
			}
		} else {
			[layer setCornerRadius:r];
			[layer setMasksToBounds:YES];
			if (@available(macOS 11.0, *)) {
				[layer setCornerCurve:kCACornerCurveContinuous];
			}
		}

		[window setHasShadow:YES];
		[window invalidateShadow];
		success = YES;
	});

	return success;
}
