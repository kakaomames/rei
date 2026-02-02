import java.util.Collection;
import java.util.List;

public record adz(adz.a b, List<String> c) implements aay<adb> {
   public static final aao<wx, adz> a = aay.a(adz::a, adz::new);

   private adz(wx $$0) {
      this((adz.a)$$0.b(adz.a.class), $$0.a(wx::p));
   }

   public adz(adz.a param1, List<String> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.a((Enum)this.b);
      $$0.a((Collection)this.c, (aaq)(wx::a));
   }

   public aba<adz> a() {
      return ahz.x;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public adz.a b() {
      return this.b;
   }

   public List<String> e() {
      return this.c;
   }

   public static enum a {
      a,
      b,
      c;

      // $FF: synthetic method
      private static adz.a[] a() {
         return new adz.a[]{a, b, c};
      }
   }
}
