import java.util.HashMap;
import java.util.Map;

public record ahw(Map<amt<drb>, drb> b, drf.b<drs> c) implements aay<adb> {
   public static final aao<xq, ahw> a;

   public ahw(Map<amt<drb>, drb> param1, drf.b<drs> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ahw> a() {
      return ahz.bn;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public Map<amt<drb>, drb> b() {
      return this.b;
   }

   public drf.b<drs> e() {
      return this.c;
   }

   static {
      a = aao.a(aam.a(HashMap::new, amt.b(drb.a), drb.i), ahw::b, drf.b.b(), ahw::e, ahw::new);
   }
}
