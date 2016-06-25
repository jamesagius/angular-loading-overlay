import IBsLoadingOverlayOptions from './IBsLoadingOverlayOptions';
import BsLoadingOverlayInstance from './BsLoadingOverlayInstance';
import {BsLoadingOverlayService} from './BsLoadingOverlayService';

interface BsLoadingOverlayDirectiveAttributes extends ng.IAttributes {
    bsLoadingOverlayReferenceId: string;
    bsLoadingOverlay: string;
    bsLoadingOverlayDelay: number;
    bsLoadingOverlayActiveClass: string;
    bsLoadingOverlayTemplateUrl: string;
}

export default class BsLoadingOverlayDirective implements ng.IDirective {
    constructor(
        private $compile: ng.ICompileService,
        private $rootScope: ng.IRootScopeService,
        private $templateRequest: ng.ITemplateRequestService,
        private $q: ng.IQService,
        private $timeout: ng.ITimeoutService,
        private bsLoadingOverlayService: BsLoadingOverlayService
    ) {}

    private updateOverlayElement(overlayInstance: BsLoadingOverlayInstance) {
        if (this.bsLoadingOverlayService.isActive(overlayInstance.referenceId)) {
            overlayInstance.add();
        } else {
            overlayInstance.remove();
        }
    };

    restrict = 'EA';
    link: ng.IDirectiveLinkFn = (scope: ng.IScope, $element: ng.IAugmentedJQuery, $attributes: BsLoadingOverlayDirectiveAttributes) => {
        let templatePromise: ng.IPromise<string>;
        const globalConfig = this.bsLoadingOverlayService.getGlobalConfig();
        const templateUrl = $attributes.bsLoadingOverlayTemplateUrl || globalConfig.templateUrl;
        let overlayElement = null;

        if (templateUrl) {
            templatePromise = this.$templateRequest(templateUrl);
        } else {
            templatePromise = this.$q.reject();
        }

        templatePromise.then((loadedTemplate: string) => {
            overlayElement = this.$compile(loadedTemplate)(scope);
            overlayElement.data('isAttached', false);
        }).finally(() => {
            const overlayInstance = new BsLoadingOverlayInstance(
                $attributes.bsLoadingOverlayReferenceId || ($attributes.bsLoadingOverlay === '' ? undefined : $attributes.bsLoadingOverlay),
                +$attributes.bsLoadingOverlayDelay || globalConfig.delay,
                $attributes.bsLoadingOverlayActiveClass || globalConfig.activeClass,
                $element,
                overlayElement,
                this.$timeout,
                this.$q
            );

            const unsubscribe = this.$rootScope.$on(
                'bsLoadingOverlayUpdateEvent',
                (event: ng.IAngularEvent, options: IBsLoadingOverlayOptions) => {
                    if (options.referenceId === overlayInstance.referenceId) {
                        this.updateOverlayElement(overlayInstance);
                    }
                }
            );

            $element.on('$destroy', unsubscribe);
            this.updateOverlayElement(overlayInstance);
        });
    }
}

export const BsLoadingOverlayDirectiveFactory: ng.IDirectiveFactory = (
    $compile: ng.ICompileService,
    $rootScope: ng.IRootScopeService,
    $templateRequest: ng.ITemplateRequestService,
    $q: ng.IQService,
    $timeout: ng.ITimeoutService,
    bsLoadingOverlayService: BsLoadingOverlayService
) => (
    new BsLoadingOverlayDirective(
        $compile,
        $rootScope,
        $templateRequest,
        $q,
        $timeout,
        bsLoadingOverlayService
    )
);

BsLoadingOverlayDirectiveFactory.$inject = [
    '$compile',
    '$rootScope',
    '$templateRequest',
    '$q',
    '$timeout',
    'bsLoadingOverlayService'
];
