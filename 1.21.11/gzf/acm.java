import io.netty.buffer.ByteBuf;
import java.util.List;

public record acm(List<bag> b) implements aay<ach> {
   public static final aao<ByteBuf, acm> a;

   public acm(List<bag> param1) {
      this.b = $$0;
   }

   public aba<acm> a() {
      return aco.e;
   }

   public void a(ach $$0) {
      $$0.a(this);
   }

   public List<bag> b() {
      return this.b;
   }

   static {
      a = aao.a(bag.a.a(aam.a()), acm::b, acm::new);
   }
}
